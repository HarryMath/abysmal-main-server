import { Module } from '@nestjs/common';
import { NodesController } from './nodes/nodes.controller';
import { NodesService } from './nodes/nodes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NodeServer } from './nodes/node';

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
      entities: [NodeServer],
      synchronize: false,
      retryAttempts: 3,
      retryDelay: 2000
    }),
    TypeOrmModule.forFeature([NodeServer])
  ],
  controllers: [NodesController],
  providers: [NodesService],
})
export class AppModule {}
