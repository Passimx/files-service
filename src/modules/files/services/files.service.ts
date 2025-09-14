import { Injectable } from '@nestjs/common';
import { InjectWebDAV, WebDAV } from 'nestjs-webdav';
import { File } from '@nest-lab/fastify-multer';
import { DataResponse } from '../../../common/swagger/data-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
    constructor(
        // @ts-ignore
        @InjectWebDAV()
        private readonly webDav: WebDAV,
    ) {}

    async uploadFile(file: File): Promise<DataResponse<string>> {
        try {
            const filePath = uuidv4();
            await this.webDav.putFileContents(filePath, file.buffer);

            return DataResponse.success(filePath);
        } catch (e) {
            return DataResponse.error(`Failed to upload file: ${e.message}`);
        }
    }

    async getFileData(id: string): Promise<DataResponse<Buffer>> {
        try {
            const buffer = (await this.webDav.getFileContents(id)) as Buffer;
            return DataResponse.success(buffer);
        } catch (e) {
            return DataResponse.error(Buffer.alloc(0));
        }
    }

    encodeRFC5987ValueChars(str: string): string {
        return encodeURIComponent(str)
            .replace(/['()]/g, escape)

            .replace(/\*/g, '%2A')

            .replace(/%(?:7C|60|5E)/g, unescape);
    }
}
