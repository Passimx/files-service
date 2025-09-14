import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class DataResponse<T> {
    @IsBoolean()
    @ApiProperty()
    readonly success: boolean;

    @ApiProperty()
    readonly data: T;

    constructor(data: T, success: boolean = true) {
        this.success = success;
        this.data = data;
    }

    static success<T>(data: T): DataResponse<T> {
        return new DataResponse(data, true);
    }

    static error<T>(data: T): DataResponse<T> {
        return new DataResponse(data, false);
    }
}
