import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDto {
    @ApiProperty()
    @IsString()
    readonly chatId!: string;
}

export class FileUploadResponseDto {
    @ApiProperty()
    readonly fileId!: string;

    @ApiProperty()
    readonly previewId?: string;
}
