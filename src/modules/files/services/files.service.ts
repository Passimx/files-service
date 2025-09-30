import { createReadStream, createWriteStream, promises as fs, statSync } from 'fs';
import { dirname, join } from 'path';
import * as process from 'process';
import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { File } from '@nest-lab/fastify-multer';
import { FastifyReply } from 'fastify';
import { DataResponse } from '../../../common/swagger/data-response.dto';
import { UploadDto } from '../dto/upload.dto';
import { logger } from '../../../common/logger/logger';

@Injectable()
export class FilesService {
    private readonly STORAGE_ROOT = join(process.cwd(), 'data', 'files');

    public async uploadFile(file: File, { chatId }: UploadDto): Promise<DataResponse<string>> {
        try {
            // 1. Генерируем хэш содержимого
            const hash = createHash('sha256').update(file.buffer!).digest('hex');
            const filePath = `/${chatId}/${hash}`;

            try {
                const stat = statSync(join(this.STORAGE_ROOT, filePath));
                if (stat.size === file.size) return DataResponse.success(hash);
                return this.saveFile(hash, chatId, file.buffer!);
            } catch (e) {
                return this.saveFile(hash, chatId, file.buffer!);
            }
        } catch (e) {
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
            // если файл не найден
            reply.status(404).send(DataResponse.error(`File not found`));
        }
    }

    private async saveFile(hash: string, chatId: string, buffer: Buffer): Promise<DataResponse<string>> {
        const absPath = join(this.STORAGE_ROOT, chatId, hash);

        await fs.mkdir(dirname(absPath), { recursive: true });

        return new Promise((resolve, reject) => {
            const stream = createWriteStream(absPath);
            stream.write(buffer);
            stream.end();
            stream.on('finish', () => resolve(DataResponse.success(hash)));
            stream.on('error', () => reject());
        });
    }
}
