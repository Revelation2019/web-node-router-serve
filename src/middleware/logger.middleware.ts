import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    next();
    logger.info(
      {
        type: 'access',
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
      },
      `%s %s %d`,
      req.method,
      req.url,
      res.statusCode,
    );
  }
}
