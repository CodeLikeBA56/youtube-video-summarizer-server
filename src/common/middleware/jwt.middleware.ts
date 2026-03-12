import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtMiddleware.name);

  constructor(private readonly userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.accessToken;

    // Check Authorization header if not in cookies
    if (!token && req.headers.authorization) {
      const [type, headerToken] = req.headers.authorization.split(' ');
      if (type === 'Bearer') {
        token = headerToken;
      }
    }

    if (!token) {
      // We don't throw UnauthorizedException here because some routes might be public.
      // Guards should handle authorization logic for protected routes.
      return next();
    }

    try {
      const payload = await this.userService.verifyAccessToken(token);
      const user = await this.userService.getUserById(payload.id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user to request object
      req['user'] = user;
      next();
    } catch (error) {
      this.logger.error(`JWT Verification failed: ${error.message}`);
      // Clear invalid cookie if it exists
      if (req.cookies?.accessToken) {
        res.clearCookie('accessToken');
      }
      next(); // Let guards handle the missing user if route is protected
    }
  }
}
