import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Controller('internal')
@UseGuards(ApiKeyGuard)
export class InternalController {
  @Get('status')
  status() {
    return {
      service: 'cms',
      protected: true,
      timestamp: new Date().toISOString(),
    };
  }
}
