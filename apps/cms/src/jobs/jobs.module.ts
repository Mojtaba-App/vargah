import { Module } from '@nestjs/common';

import { JobsController } from './jobs.controller';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Module({
  controllers: [JobsController],
  providers: [ApiKeyGuard],
})
export class JobsModule {}
