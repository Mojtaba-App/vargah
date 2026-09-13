import { Module } from '@nestjs/common';

import { ContentController } from './content.controller';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Module({
  controllers: [ContentController],
  providers: [ApiKeyGuard],
})
export class ContentModule {}
