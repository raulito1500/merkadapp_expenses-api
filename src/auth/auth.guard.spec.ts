import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AuthGuard } from './auth.guard';
import { UsersService } from '../users/users.service';

jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn().mockReturnValue([]),
  initializeApp: jest.fn(),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let verifyIdToken: jest.Mock;
  let usersService: jest.Mocked<UsersService>;

  const createContext = (headers: Record<string, string>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    (getApps as jest.Mock).mockReturnValue([]);
    verifyIdToken = jest.fn();
    (getAuth as jest.Mock).mockReturnValue({ verifyIdToken });

    const configService = {
      get: jest.fn().mockReturnValue('test-value'),
    } as unknown as ConfigService;
    usersService = {
      upsert: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UsersService>;

    guard = new AuthGuard(configService, usersService);
  });

  it('initializes the firebase-admin app once', () => {
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(cert).toHaveBeenCalledWith({
      projectId: 'test-value',
      clientEmail: 'test-value',
      privateKey: 'test-value',
    });
  });

  it('rejects requests without an Authorization header', async () => {
    const context = createContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token that firebase-admin cannot verify', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'));
    const context = createContext({ authorization: 'Bearer bad-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('attaches the decoded user to the request and allows it through', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'user-123',
      email: 'raul@example.com',
      name: 'Raul',
      picture: 'https://lh3.googleusercontent.com/photo.jpg',
    });
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer good-token' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      uid: 'user-123',
      email: 'raul@example.com',
      name: 'Raul',
    });
    expect(usersService.upsert).toHaveBeenCalledWith({
      uid: 'user-123',
      email: 'raul@example.com',
      displayName: 'Raul',
      photoURL: 'https://lh3.googleusercontent.com/photo.jpg',
    });
  });

  it('still allows the request through when the directory upsert fails', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'user-123' });
    usersService.upsert.mockRejectedValue(new Error('db down'));
    const context = createContext({ authorization: 'Bearer good-token' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
