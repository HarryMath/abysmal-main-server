const axios = require('axios')

export class Cluster {
  ip: string;
  serversAmount: number;

  constructor(ip: string, serversAmount: number) {
    this.ip = ip;
    this.serversAmount = serversAmount;
  }

  async createServer(): Promise<boolean> {
    try {
      const response = await axios.post(`https://${this.ip}:${8080}/nodes/create`);
      return response.status == 200;
    } catch (e) {
      return false;
    }
  }
}
