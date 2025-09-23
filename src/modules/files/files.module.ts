import { Module } from '@nestjs/common';
import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { WebDAVModule } from 'nestjs-webdav';

import { Envs } from '../../common/envs/env';
import { FilesService } from './services/files.service';
import { FilesController } from './controllers/files.controller';

@Module({
    imports: [
        FastifyMulterModule,
        WebDAVModule.forRootAsync({
            useFactory: () => {
                return {
                    config: {
                        endpoint: `${Envs.webdav.host}:${Envs.webdav.port}`,
                        username: Envs.webdav.user,
                        password: Envs.webdav.password,
                    },
                };
            },
        }),
    ],
    controllers: [FilesController],
    providers: [FilesService],
    exports: [FilesService],
})
export class FilesModule {}
