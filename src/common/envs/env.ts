import * as process from 'process';
import { config } from 'dotenv';
import { NumbersUtils } from '../utils/numbers.utils';
import { BooleanUtils } from './boolean.utils';

config();

export const Envs = {
    main: {
        host: '0.0.0.0',
        appPort: NumbersUtils.toNumberOrDefault(process.env.APP_PORT_FILES, 3000),
    },

    kafka: {
        host: process.env.KAFKA_HOST,
        port: process.env.KAFKA_EXTERNAL_PORT,
        user: String(process.env.KAFKA_CLIENT_USERS),
        password: String(process.env.KAFKA_USER_PASSWORD),
        kafkaIsConnect: BooleanUtils.strToBoolWithDefault(false),
    },

    webdav: {
        host: process.env.WEBDAV_HOST,
        port: process.env.WEBDAV_PORT,
        user: String(process.env.USER_NAME_WEBDAV),
        password: String(process.env.PASSWORD_WEBDAV),
    },

    swagger: {
        path: process.env.SWAGGER_PATH || 'docs',
        isWriteConfig: BooleanUtils.strToBoolWithDefault(process.env.SWAGGER_IS_WRITE_CONFIG, false),
        url: `http://localhost:${process.env.APP_PORT ?? 3000}`,
        description: 'development',
    },
};
