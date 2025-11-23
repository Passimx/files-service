import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiFileUpload = () =>
    applyDecorators(
        ApiResponse({
            status: 200,
            schema: {
                properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                        properties: {
                            fileId: { type: 'string' },
                        },
                        required: ['fileId'],
                    },
                },
            },
        }),
    );
