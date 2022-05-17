import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { NodeEntity, NodeServer } from './node';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cluster } from './cluster';

@Injectable()
export class NodesService {

  private activeServers: NodeEntity[] = [];
  private consumers: ((s: NodeEntity) => void)[] = [];
  private readonly maxPlayersPerNode = 100;

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
        await this.removeClosedServer(servers[i].ip, servers[i].udpPort);
        servers.splice(i--, 1);
      }
    }
    this.activeServers = servers;
  }

  async provideServer(): Promise<NodeEntity> {
    let candidates = this.activeServers.filter(s => s.playersAmount < this.maxPlayersPerNode);
    if (candidates.length === 0) {
      await this.refresh();
      if (this.activeServers.length === 0) {
        throw new HttpException('no available servers', 204);
      }
      candidates = this.activeServers.filter(s => s.playersAmount < this.maxPlayersPerNode);
    }
    if (candidates.length === 0) {
      console.log("no candidates. trying to launch server");
      return this.activeServers.length === 0 ? null : await this.createNewServer();
    }
    const bestPlayersAmountAvailable = Math.max(
      ...candidates.map(s => {return s.playersAmount})
    );
    console.log('best players amount is: ' + bestPlayersAmountAvailable);
    return candidates.find(c => c.playersAmount === bestPlayersAmountAvailable);
  }

  updateServer(server: NodeEntity): void {
    const oldServer = this.activeServers.find(s => s.ip === server.ip && s.udpPort === server.udpPort);
    if (!oldServer) { // unreachable part of code
      throw new NotFoundException();
    }
    oldServer.playersAmount = server.playersAmount;
  }

  registerServer(server: NodeEntity): void {
    const oldServer = this.activeServers.find(s => s.ip === server.ip && s.udpPort === server.udpPort);
    if (!oldServer) {
      console.log('saving new node');
      this.activeServers.push(server);
      this.serversRepository.save(server);
    } else { // unreachable part of code
      console.log('updating old node');
      oldServer.tcpPort = server.tcpPort;
      oldServer.playersAmount = server.playersAmount;
      this.serversRepository.update({ip: server.ip, udpPort: server.udpPort}, server);
    }
    for (let i = 0; i < this.consumers.length; i++) {
      this.consumers[i](server);
      this.consumers.splice(i--, 1);
    }
  }

  removeClosedServer(ip: string, port: number): void {
    let i = 0;
    for (let s of this.activeServers) {
      if (s.ip === ip && s.udpPort == port) {
        this.activeServers.splice(i, 1);
        break;
      }
      i++;
    }
    console.log('removing closed serer');
    this.serversRepository.delete({ip, udpPort: port});
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
