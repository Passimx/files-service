import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse } from '@nestjs/swagger';


export function ApiDataArrayNumbers() {
    return applyDecorators(
        ApiExtraModels(),
        ApiOkResponse({
            schema: {
                anyOf: [
                    {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            data: { type: 'array', items: { type: 'number' } },
                        },
                        required: ['success', 'data'],
                    },

                    {
                        type: 'object',

                        properties: {
                            success: { type: 'boolean', example: false },
                            data: {
                                type: 'string',
                            },
                        },
                        required: ['success', 'data'],
                    },
                ],
            },
        }),
    );
}
