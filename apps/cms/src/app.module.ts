import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { InternalController } from './internal/internal.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ContentModule } from './content/content.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [HealthModule, ContentModule, JobsModule],
  controllers: [AppController, InternalController],
  providers: [AppService, ApiKeyGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
