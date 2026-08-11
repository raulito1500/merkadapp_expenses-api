import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import type { AuthenticatedRequest } from './authenticated-request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: this.configService.get<string>('firebase.projectId'),
          clientEmail: this.configService.get<string>('firebase.clientEmail'),
          privateKey: this.configService.get<string>('firebase.privateKey'),
        }),
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let photoURL: string | undefined;
    try {
      const decoded = await getAuth().verifyIdToken(token);
      request.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name as string | undefined,
      };
      photoURL = decoded.picture;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Best-effort directory sync: never let this fail the request.
    this.usersService
      .upsert({
        uid: request.user.uid,
        email: request.user.email,
        displayName: request.user.name,
        photoURL,
      })
      .catch((error: unknown) =>
        this.logger.warn(
          `Failed to upsert user directory entry: ${String(error)}`,
        ),
      );

    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }
    return header.slice('Bearer '.length);
  }
}
