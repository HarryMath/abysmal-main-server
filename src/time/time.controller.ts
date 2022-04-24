import { Controller, Get } from '@nestjs/common';

@Controller('time')
export class TimeController {

  @Get()
  public getTime(): {timestamp: number} {
    return {timestamp: new Date().getTime()}
  }
}
