import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDto {
    @ApiProperty()
    @IsString()
    readonly chatId!: string;
}
