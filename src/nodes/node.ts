import { Column, Entity, PrimaryColumn } from 'typeorm';
const axios = require('axios')

export interface NodeEntity {
  ip: string;
  port: number;
  playersAmount: number;
}

@Entity('nodes')
export class NodeServer {
  @PrimaryColumn('varchar', {length: 20})
  ip: string;

  @PrimaryColumn('int', {})
  port: number;

  @Column('int', {default: 0})
  playersAmount: number;

  async verify(): Promise<boolean> {
    try {
      const response = await axios.get(`https://${this.ip}:${this.port}/players/amount`);
      console.log(`statusCode: ${response.status}`);
      console.log(`body: ${response.body}`);
      if (response.status == 200) {
        this.playersAmount = parseInt(response.body);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
