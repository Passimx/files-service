import { createReadStream, createWriteStream, promises as fs, statSync } from 'fs';
import { dirname, join } from 'path';
import * as process from 'process';
import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { File } from '@nest-lab/fastify-multer';
import { FastifyReply } from 'fastify';
import sharp from 'sharp';
import { DataResponse } from '../../../common/swagger/data-response.dto';
import { UploadDto, FileUploadResponseDto } from '../dto/upload.dto';
import { logger } from '../../../common/logger/logger';

@Injectable()
export class FilesService {
    private readonly STORAGE_ROOT = join(process.cwd(), 'data', 'files');

    public async uploadFile(file: File, { chatId }: UploadDto): Promise<DataResponse<FileUploadResponseDto | string>> {
        try {
            const hash = createHash('sha256').update(file.buffer!).digest('hex');
            const filePath = `/${chatId}/${hash}`;

            try {
                const stat = statSync(join(this.STORAGE_ROOT, filePath));
                if (stat.size === file.size) {
                    // Файл уже существует
                    let previewId: string | undefined;
                    if (this.isImage(file.mimetype)) {
                        previewId = `${hash}_preview.webp`;
                    }
                    return DataResponse.success({
                        fileId: hash,
                        previewId,
                    });
                }
                return this.saveFileWithPreview(hash, chatId, file);
            } catch (e) {
                return this.saveFileWithPreview(hash, chatId, file);
            }
        } catch (e: any) {
            logger.error(e);
            return DataResponse.error(`Failed to upload file: ${e.message}`);
        }
    }

    public downFile(chatId: string, fileId: string, reply: FastifyReply) {
        try {
            const filePath = join(this.STORAGE_ROOT, `${chatId}/${fileId}`);

            const stat = statSync(filePath);
            const stream = createReadStream(filePath);

            reply
                .headers({
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${fileId}"`,
                    'Content-Length': stat.size,
                })
                .send(stream);
        } catch (err) {
            reply.status(404).send(DataResponse.error(`File not found`));
        }
    }

    public downFilePreview(chatId: string, previewId: string, reply: FastifyReply) {
        try {
            const previewPath = join(this.STORAGE_ROOT, `${chatId}/${previewId}`);
            const stat = statSync(previewPath);
            const stream = createReadStream(previewPath);

            reply
                .headers({
                    'Content-Type': 'image/webp',
                    'Content-Disposition': `inline; filename="${previewId}"`,
                    'Content-Length': stat.size,
                    'Cache-Control': 'public, max-age=31536000', // Кешируем превью на год
                })
                .send(stream);
        } catch (err) {
            reply.status(404).send(DataResponse.error(`Preview not found`));
        }
    }

    private async saveFileWithPreview(
        hash: string,
        chatId: string,
        file: File,
    ): Promise<DataResponse<FileUploadResponseDto>> {
        const absPath = join(this.STORAGE_ROOT, chatId, hash);
        await fs.mkdir(dirname(absPath), { recursive: true });

        await new Promise((resolve, reject) => {
            const stream = createWriteStream(absPath);
            stream.write(file.buffer!);
            stream.end();
            stream.on('finish', () => resolve(DataResponse.success(hash)));
            stream.on('error', () => reject());
        });

        let previewId: string | undefined;
        if (this.isImage(file.mimetype)) {
            await this.generatePreview(hash, chatId, file.buffer!);
            previewId = `${hash}_preview.webp`;
        }

        return DataResponse.success({
            fileId: hash,
            previewId,
        });
    }

    private isImage(mimetype?: string): boolean {
        return mimetype ? mimetype.startsWith('image/') : false;
    }

    private async generatePreview(hash: string, chatId: string, buffer: Buffer): Promise<void> {
        const previewPath = join(this.STORAGE_ROOT, chatId, `${hash}_preview.webp`);
        await sharp(buffer)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(previewPath);
    }
}
