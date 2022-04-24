import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NodeServer } from './nodes/node';
import { NodesModule } from './nodes/nodes.module';
import { TimeController } from './time/time.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.prod', '.env.template'],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      keepConnectionAlive: false,
      synchronize: false,
      dropSchema: false,
      retryAttempts: 1,
      retryDelay: 5000,
      entities: [NodeServer],
      extra: {
        connectionLimit: 3,
      }
    }),
    NodesModule
  ],
  controllers: [TimeController]
})
export class AppModule {}
