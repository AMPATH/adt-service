import dotenv from "dotenv";
import HTTPInterceptor from "./http-interceptor";
import ConnectionManager from "./mysql";
const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}
export default {
  databaseURL: process.env.mysqlHost,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.port,
  amrsUrl: process.env.amrsUrl,
  amrsUsername: process.env.amrsUsername,
  amrsPassword: process.env.amrsPassword,
  connectionLimit: process.env.connectionLimit,
  server: process.env.server,
  adt: {
    username: process.env.amrsUsername,
    password: process.env.amrsPassword,
    https: false,
    host: process.env.adtHost,
    port: process.env.adtPort
  },
  amrsProd:{
    databaseURL: process.env.prodDbURL,
    user: process.env.user,
    password: process.env.password,
    database: process.env.prodDb,
    port: process.env.prodDbPort,
    connectionLimit: process.env.connectionLimit
  },
  amrsSlave:{
    databaseURL: process.env.mysqlHost,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port,
    connectionLimit: process.env.connectionLimit
  },
  prodDbURL: process.env.prodDbURL,
  prodDbPort: process.env.prodDbPort,
  prodDb: process.env.prodDb,
  HTTPInterceptor:HTTPInterceptor,
  ConnectionManager:ConnectionManager,
  sms: {
    apiKey:process.env.apiKey,
    url:process.env.smsProviderURL
  },
  redis:{
    namespace: 'amrs-integrations',
    redis: {
        client: 'redis',
        options: {
            host: process.env.redisHost,
            port: 6379,
            connect_timeout: 3600000,
        },
    },
    logger: {
        enabled: true,
        options: {
            level: 'info',
            /*
            streams: [
                {
                    path: path.normalize(`${__dirname}/../logs/redis-smq.log`)
                },
            ],
            */
        },
    },
    monitor: {
        enabled: false,
        host: '127.0.0.1',
        port: 3000,
    },
    message: {
        consumeTimeout: 60000,
        retryThreshold: 5,
        retryDelay: 60000,
        ttl: 120000,
    },
    storeMessages: false,
}
};

