import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, headers } = request;
    const origin = headers.origin || 'N/A';
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode, statusMessage } = response;
      const duration = Date.now() - startTime;

      const logMessage = `[${method}] ${originalUrl} | Status: ${statusCode} ${statusMessage} | Origin: ${origin} | Duration: ${duration}ms`;

      if (statusCode >= 400) {
        this.logger.error(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
