import { applyDecorators } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';

export const ApiFileDownload = () =>
    applyDecorators(
        ApiParam({ name: 'chatId', type: String, description: 'Chat ID' }),
        ApiParam({ name: 'fileId', type: String, description: 'File ID' }),
        ApiResponse({
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
        }),
    );
