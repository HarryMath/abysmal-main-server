import { Column, Entity, PrimaryColumn } from 'typeorm';
const axios = require('axios')

export interface NodeEntity {
  ip: string;
  udpPort: number;
  tcpPort: number;
  playersAmount: number;
}

@Entity('nodes')
export class NodeServer {
  @PrimaryColumn('varchar', {length: 20})
  ip: string;

  @PrimaryColumn('int', {})
  udpPort: number;

  @Column('int', {})
  tcpPort: number;

  @Column('int', {default: 0})
  playersAmount: number;

  async verify(): Promise<boolean> {
    try {
      const host = this.ip.replace('::ffff:', '');
      const response = await axios.get(`http://${host}:${this.tcpPort}/players/amount`);
      if (response.status == 200) {
        this.playersAmount = parseInt(response.data);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
