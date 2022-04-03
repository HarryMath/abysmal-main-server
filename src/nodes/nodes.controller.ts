import { Body, Controller, Get, Ip, Patch, Post } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { NodeEntity } from './node';

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
    @Ip() ip,
  ) {
    node.ip = ip;
    this.nodesService.registerServer(node)
  }

  @Patch()
  updateServer(
    @Body() node: NodeEntity,
    @Ip() ip,
  ) {
    node.ip = ip;
    node.playersAmount > 0 ? this.nodesService.updateServer(node) :
      this.nodesService.removeClosedServer(node.ip, node.port);
  }
}
