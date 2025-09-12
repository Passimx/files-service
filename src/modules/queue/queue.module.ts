import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Envs } from '../../common/envs/env';
import { FilesModule } from '../files/files.module';
import { FileEntity } from '../files/entity/file.entity';
import { QueueService } from './services/queue.service';
import { InjectEnum } from './types/inject.enum';

@Module({
    imports: [
        forwardRef(() => FilesModule),
        MikroOrmModule.forFeature([FileEntity]),
        ClientsModule.register([
            {
                name: InjectEnum.NOTIFICATIONS_MICROSERVICE,
                transport: Transport.KAFKA,
                options: {
                    client: {
                        brokers: [`${Envs.kafka.host}:${Envs.kafka.port}`],
                        sasl: {
                            username: Envs.kafka.user,
                            password: Envs.kafka.password,
                            mechanism: 'plain',
                        },
                    },
                    consumer: {
                        groupId: 'chat-service-group',
                    },
                },
            },
        ]),
    ],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule {}
