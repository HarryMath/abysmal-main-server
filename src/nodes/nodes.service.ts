import { Injectable, NotFoundException } from '@nestjs/common';
import { NodeEntity, NodeServer } from './node';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cluster } from './cluster';

@Injectable()
export class NodesService {

  private activeServers: NodeEntity[] = [];
  private consumers: ((s: NodeEntity) => void)[] = [];

  constructor(
    @InjectRepository(NodeServer)
    private serversRepository: Repository<NodeServer>
  ) {
    this.refresh();
  }

  async refresh(): Promise<void> {
    const servers = await this.serversRepository.find();
    for (let i = 0; i < servers.length; i++) {
      if (!await servers[i].verify()) {
        await this.removeClosedServer(servers[i].ip, servers[i].port);
        servers.slice(i--, 1);
      }
    }
    this.activeServers = servers.map(s => {
      return {ip: s.ip, port: s.port, playersAmount: s.playersAmount};
    });
  }

  async provideServer(): Promise<NodeEntity> {
    const candidates = this.activeServers.filter(s => s.playersAmount < 100);
    if (candidates.length === 0) {
      return await this.createNewServer();
    }
    const bestPlayersAmountAvailable = Math.min(
      ...candidates.map(s => {return s.playersAmount})
    );
    return candidates.find(c => c.playersAmount === bestPlayersAmountAvailable);
  }

  updateServer(server: NodeEntity): void {
    const oldServer = this.activeServers.find(s => s.ip === server.ip && s.port === server.port);
    if (!oldServer) { // unreachable part of code
      throw new NotFoundException();
    }
    oldServer.playersAmount = server.playersAmount;
  }

  registerServer(server: NodeEntity): void {
    const oldServer = this.activeServers.find(s => s.ip === server.ip && s.port === server.port);
    if (!oldServer) {
      this.activeServers.push(server);
      this.serversRepository.save(server);
    } else { // unreachable part of code
      oldServer.playersAmount = server.playersAmount;
    }
    for (let i = 0; i < this.consumers.length; i++) {
      this.consumers[i](server);
      this.consumers.splice(i--, 1);
    }
  }

  removeClosedServer(ip: string, port: number): void {
    let i = 0;
    for (let s of this.activeServers) {
      if (s.ip === ip && s.port == port) {
        this.activeServers.splice(i, 1);
        break;
      }
      i++;
    }
    this.serversRepository.delete({ip, port});
  }

  private async createNewServer(): Promise<NodeEntity> {
    const clustersDict = this.activeServers.reduce(((previousValue: any, currentValue: any) => {
      const ip = currentValue.ip;
      if (!Object.prototype.hasOwnProperty.call(previousValue, currentValue.ip)) {
        previousValue[ip] = 0;
      }
      previousValue[ip]++;
      return previousValue;
    }), {});
    const clusters = Object.keys(clustersDict).map(ip => {
      return new Cluster(ip, clustersDict[ip]);
    });
    const bestServersAmountAvailable = Math.min(
      ...clusters.map(s => { return s.serversAmount})
    );
    await clusters.find(c => c.serversAmount === bestServersAmountAvailable)
      .createServer();
    return new Promise((resolve => {
      this.consumers.push(s => resolve(s));
    }));
  }
}
