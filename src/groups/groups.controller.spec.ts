import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { UsersService } from '../users/users.service';
import { UserSummary } from '../users/dto/user-summary.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDocument } from './schemas/group.schema';
import { GroupCurrencySummary } from './dto/group-summary.dto';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: jest.Mocked<GroupsService>;

  const rawGroup = {
    _id: 'group-1',
    name: 'Roommates',
    owner: 'user-123',
    members: ['user-123', 'user-456'],
  };
  const group = {
    ...rawGroup,
    toObject: () => rawGroup,
  } as unknown as GroupDocument;

  const req = { user: { uid: 'user-123' } } as AuthenticatedRequest;

  const ownerSummary: UserSummary = { uid: 'user-123', displayName: 'Raul' };
  const memberSummary: UserSummary = { uid: 'user-456', displayName: 'Manu' };
  const usersByUid = new Map<string, UserSummary>([
    ['user-123', ownerSummary],
    ['user-456', memberSummary],
  ]);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: {
            findAllForOwner: jest.fn(),
            findOne: jest.fn(),
            getSummary: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            resolveMany: jest.fn().mockResolvedValue(usersByUid),
            resolveOne: jest.fn(
              (map: Map<string, UserSummary>, uid: string) =>
                map.get(uid) ?? { uid },
            ),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(GroupsController);
    service = module.get(GroupsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllForOwner', () => {
    it('returns the groups enriched with owner/member user summaries', async () => {
      service.findAllForOwner.mockResolvedValue([group]);

      const result = await controller.findAllForOwner(req);

      expect(result).toEqual([
        {
          ...rawGroup,
          owner: ownerSummary,
          members: [ownerSummary, memberSummary],
        },
      ]);
      expect(service.findAllForOwner).toHaveBeenCalledWith('user-123');
    });
  });

  describe('findOne', () => {
    it('returns the group enriched with owner/member user summaries', async () => {
      service.findOne.mockResolvedValue(group);

      const result = await controller.findOne('group-1');

      expect(result).toEqual({
        ...rawGroup,
        owner: ownerSummary,
        members: [ownerSummary, memberSummary],
      });
    });

    it('returns null as-is when the group does not exist', async () => {
      service.findOne.mockResolvedValue(null);

      const result = await controller.findOne('missing');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('delegates creation to the service with the caller as owner', async () => {
      const dto: CreateGroupDto = {
        name: 'Roommates',
        members: ['user-456'],
      };
      service.create.mockResolvedValue(group);

      const result = await controller.create(req, dto);

      expect(result).toEqual(group);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-123');
    });
  });

  describe('getSummary', () => {
    it('enriches each member balance with its user summary', async () => {
      const summary: GroupCurrencySummary[] = [
        {
          currency: 'COP',
          total: 120000,
          perPersonShare: 60000,
          members: [
            { uid: 'user-123', paid: 90000, balance: 30000 },
            { uid: 'user-456', paid: 30000, balance: -30000 },
          ],
        },
      ];
      service.getSummary.mockResolvedValue(summary);

      const result = await controller.getSummary('group-1');

      expect(result).toEqual([
        {
          currency: 'COP',
          total: 120000,
          perPersonShare: 60000,
          members: [
            { user: ownerSummary, paid: 90000, balance: 30000 },
            { user: memberSummary, paid: 30000, balance: -30000 },
          ],
        },
      ]);
      expect(service.getSummary).toHaveBeenCalledWith('group-1');
    });
  });
});
