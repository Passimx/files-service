import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { File, FileInterceptor } from '@nest-lab/fastify-multer';
import { FilesService } from '../services/files.service';
import { DataResponse } from '../../../common/swagger/data-response.dto';
import { FileUploadResponseDto, UploadDto } from '../dto/upload.dto';
import { ApiFileUpload } from '../../../common/swagger/api-file-upload.decorator';
import { ApiFileDownload } from '../../../common/swagger/api-file-download.decorator';

@ApiTags('Files')
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiFileUpload()
    async upload(
        @UploadedFile() file: File,
        @Body() body: UploadDto,
    ): Promise<DataResponse<FileUploadResponseDto | string>> {
        return await this.filesService.uploadFile(file, body);
    }

    @ApiFileDownload()
    @Get(':chatId/:fileId')
    downFile(@Param('chatId') chatId: string, @Param('fileId') fileId: string, @Res() reply: FastifyReply) {
        return this.filesService.downFile(chatId, fileId, reply);
    }
}
