import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const user = {
    uid: 'user-123',
    email: 'raul@example.com',
    displayName: 'Raul',
  } as unknown as UserDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            upsert: jest.fn(),
            findAll: jest.fn(),
            findByUids: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsert', () => {
    it('delegates to the repository', async () => {
      repository.upsert.mockResolvedValue(user);

      const result = await service.upsert({
        uid: 'user-123',
        email: 'raul@example.com',
        displayName: 'Raul',
      });

      expect(result).toEqual(user);
      expect(repository.upsert).toHaveBeenCalledWith({
        uid: 'user-123',
        email: 'raul@example.com',
        displayName: 'Raul',
      });
    });
  });

  describe('findAll', () => {
    it('returns all users from the repository', async () => {
      repository.findAll.mockResolvedValue([user]);

      const result = await service.findAll();

      expect(result).toEqual([user]);
    });
  });

  describe('resolveMany', () => {
    it('dedupes uids and builds a map keyed by uid', async () => {
      repository.findByUids.mockResolvedValue([user]);

      const map = await service.resolveMany(['user-123', 'user-123']);

      expect(repository.findByUids).toHaveBeenCalledWith(['user-123']);
      expect(map.get('user-123')).toEqual({
        uid: 'user-123',
        email: 'raul@example.com',
        displayName: 'Raul',
        photoURL: undefined,
      });
    });
  });

  describe('resolveOne', () => {
    it('returns the summary from the map when present', () => {
      const map = new Map([
        ['user-123', { uid: 'user-123', displayName: 'Raul' }],
      ]);

      expect(service.resolveOne(map, 'user-123')).toEqual({
        uid: 'user-123',
        displayName: 'Raul',
      });
    });

    it('falls back to a bare uid when the user is unknown (e.g. free-text members)', () => {
      const map = new Map<string, { uid: string }>();

      expect(service.resolveOne(map, 'Diana')).toEqual({ uid: 'Diana' });
    });
  });
});
