import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { version } from '../package.json';
import { AppModule } from './modules/app.module';
import { logger } from './common/logger/logger';
import { useKafka } from './common/config/kafka/use-kafka';
import { useSwagger } from './common/swagger/swagger';
import { Envs } from './common/envs/env';

export class App {
    private readonly ADDRESS: string;
    private readonly PORT: number;

    constructor(PORT: number, ADDRESS: string) {
        this.PORT = PORT;
        this.ADDRESS = ADDRESS;
    }

    public async run() {
        const app = await App.createNestApp();

        app.enableCors({
            origin: ['http://localhost:3006', 'http://localhost:4173', 'https://passimx.ru'], // Разрешаем запросы только с этого домена
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true, // Разрешаем использование кук и токенов
        });

        app.useGlobalPipes(
            new ValidationPipe({
                validateCustomDecorators: true,
                whitelist: true,
                transform: true,
                transformOptions: { enableImplicitConversion: true },
                // forbidNonWhitelisted: true,
                skipMissingProperties: false,
                validationError: {
                    target: true,
                    value: true,
                },
            }),
        );

        await useKafka(app);

        if (Envs.swagger.isWriteConfig) useSwagger(app);

        await app.listen(this.PORT, this.ADDRESS);

        this.logInformationAfterStartServer(await app.getUrl());
    }

    public static createNestApp(): Promise<NestFastifyApplication> {
        return NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
            bufferLogs: true,
        });
    }

    private logInformationAfterStartServer(url: string) {
        if (Envs.swagger.isWriteConfig)
            logger.info(`Swagger is running on url: ${url}/${Envs.swagger.path} at ${Date()}. Version: '${version}'.`);
    }
}
