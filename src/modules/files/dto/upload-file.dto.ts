import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';
import {Transform, Type} from 'class-transformer';
import { FileEnum } from '../types/file.enum';

export class UploadFileDto {

    @ApiProperty({ enum: FileEnum })
    @IsEnum(FileEnum)
    readonly fileType!: FileEnum;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    duration?: number;

    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
    @IsArray()
    @IsNumber({}, { each: true })
    loudnessData?: number[];

}
