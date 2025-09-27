import { Module } from '@nestjs/common';
import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { FilesService } from './services/files.service';
import { FilesController } from './controllers/files.controller';

@Module({
    imports: [FastifyMulterModule],
    controllers: [FilesController],
    providers: [FilesService],
    exports: [FilesService],
})
export class FilesModule {}
