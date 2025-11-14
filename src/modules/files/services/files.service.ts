import { createReadStream, createWriteStream, promises as fs, statSync } from 'fs';
import { dirname, join } from 'path';
import * as process from 'process';
import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { File } from '@nest-lab/fastify-multer';
import { FastifyReply } from 'fastify';
import { DataResponse } from '../../../common/swagger/data-response.dto';
import { FileUploadResponseDto, UploadDto } from '../dto/upload.dto';
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
                // Файл уже существует
                if (stat.size === file.size) {
                    return DataResponse.success({
                        fileId: hash,
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

        return DataResponse.success({
            fileId: hash,
        });
    }
}
