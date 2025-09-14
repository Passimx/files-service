import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { File, FileInterceptor } from '@nest-lab/fastify-multer';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { FilesService } from '../services/files.service';
import { DataResponse } from '../../../common/swagger/data-response.dto';

@ApiTags('Files')
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(@UploadedFile() file: File): Promise<DataResponse<string>> {
        return await this.filesService.uploadFile(file);
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
        const response = await this.filesService.getFileData(id);

        reply.headers({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${id}"`,
            'Content-Length': response.data.length,
        });

        reply.send(response.data);
    }
}
