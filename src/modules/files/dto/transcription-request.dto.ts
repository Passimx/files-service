import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TranscriptionRequestDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly fileId!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly chatId!: string;
}

export class TranscriptionResponseDto {
    @ApiProperty()
    readonly fileId!: string;

    @ApiProperty()
    readonly transcription!: string;
}
