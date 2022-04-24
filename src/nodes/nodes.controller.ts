import { Body, Controller, Delete, Get, Ip, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { NodeEntity } from './node';
import { RealIP } from 'nestjs-real-ip';

@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Get('/provide')
  async getServer(): Promise<NodeEntity> {
    return await this.nodesService.provideServer();
  }

  @Post()
  registerServer(
    @Body() node: NodeEntity,
    @RealIP() realIp: string,
    @Ip() ip: string,
  ) {
    node.ip = ip;
    console.log('trying to save node: ');
    console.log(node);
    console.log('realIP: ' + realIp);
    this.nodesService.registerServer(node)
  }

  @Patch()
  updateServer(
    @Body() node: NodeEntity,
    @Ip() ip: string,
  ) {
    node.ip = ip;
    node.playersAmount > 0 && this.nodesService.updateServer(node);
  }
  
  @Delete()
  closeServer(
    @Param('port', ParseIntPipe) port: number,
    @Ip() ip: string
  ) {
    this.nodesService.removeClosedServer(ip, port);
  }
}
