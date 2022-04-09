import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeServer } from './node';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';

@Module({
  imports: [TypeOrmModule.forFeature([NodeServer])],
  controllers: [NodesController],
  providers: [NodesService],
})
export class NodesModule {}
