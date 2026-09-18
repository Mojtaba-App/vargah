import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { headers: Record<string, string> }>();
    const apiKey = process.env.CMS_API_KEY;
    if (!apiKey) {
      throw new UnauthorizedException('CMS_API_KEY not configured');
    }
    const provided = request.headers['x-api-key'];
    if (!provided || provided !== apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
