import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      message: 'API ماهنامه وارگه — content read + job wake',
      status: 'ready',
      editorial: 'next-admin',
    };
  }
}
