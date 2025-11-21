import { Module } from '@nestjs/common';
import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { QueueModule } from '../queue/queue.module';
import { FilesService } from './services/files.service';
import { FilesController } from './controllers/files.controller';
import { TranscriptionService } from './services/transcription.service';
import { TranscriptionController } from './controllers/transcription.controller';

@Module({
    imports: [FastifyMulterModule, QueueModule],
    controllers: [FilesController, TranscriptionController],
    providers: [FilesService, TranscriptionService],
    exports: [FilesService],
})
export class FilesModule {}
