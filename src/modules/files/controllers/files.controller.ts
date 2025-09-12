import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { File, FileInterceptor } from '@nest-lab/fastify-multer';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { FilesService } from '../services/files.service';
import { FileEntity } from '../entity/file.entity';
import { ApiData } from '../../../common/swagger/api-data.decorator';
import { DataResponse } from '../../../common/swagger/data-response.dto';
import { UploadFileDto } from '../dto/upload-file.dto';

@ApiTags('Files')
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('upload')
    @ApiData(FileEntity)
    @UseInterceptors(FileInterceptor('file'))
    async upload(@UploadedFile() file: File, @Body() body: UploadFileDto): Promise<DataResponse<string>> {
        console.log(body)
        return await this.filesService.uploadFile(file, body.fileType, body.duration, body.loudnessData);
    }

    @ApiParam({ name: 'id', type: String, description: 'File ID' })
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
    @Get(':id')
    async downFile(@Param('id') id: string, @Res() reply: FastifyReply) {
        const { info, buffer } = await this.filesService.getFileData(id);

        const encodedFilename = this.filesService.encodeRFC5987ValueChars(info.originalName);

        reply.headers({
            'Content-Type': info.mimeType,
            'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
            'Content-Length': buffer.length,
        });

        reply.send(buffer);
    }
}
