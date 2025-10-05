import { join } from 'path';
import * as fs from 'fs';
import process from 'process';
import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { File, FileInterceptor } from '@nest-lab/fastify-multer';
import { FilesService } from '../services/files.service';
import { DataResponse } from '../../../common/swagger/data-response.dto';
import { UploadDto, FileUploadResponseDto } from '../dto/upload.dto';

@ApiTags('Files')
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file: File,
        @Body() body: UploadDto,
    ): Promise<DataResponse<FileUploadResponseDto | string>> {
        return await this.filesService.uploadFile(file, body);
    }

    @ApiParam({ name: 'chatId', type: String, description: 'Chat ID' })
    @ApiParam({ name: 'previewId', type: String, description: 'Preview ID' })
    @Get('preview/:chatId/:previewId')
    downPreview(@Param('chatId') chatId: string, @Param('previewId') previewId: string, @Res() reply: FastifyReply) {
        return this.filesService.downFilePreview(chatId, previewId, reply);
    }

    @ApiParam({ name: 'chatId', type: String, description: 'Chat ID' })
    @ApiParam({ name: 'fileId', type: String, description: 'File ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns the file as Buffer',
        content: {
            'application/octet-stream': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @Get(':chatId/:fileId')
    downFile(@Param('chatId') chatId: string, @Param('fileId') fileId: string, @Res() reply: FastifyReply) {
        return this.filesService.downFile(chatId, fileId, reply);
    }

    @Get('vpn')
    getVPNProfile(@Res() reply: FastifyReply) {
        const STORAGE_ROOT = join(process.cwd(), 'vpn.mobileconfig');

        const file = fs.readFileSync(STORAGE_ROOT);

        reply
            .header('Content-Type', 'application/x-apple-aspen-config')
            .header('Content-Disposition', 'attachment; filename="vpn.mobileconfig"')
            .send(file);
    }
}
