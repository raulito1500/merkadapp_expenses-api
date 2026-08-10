import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDocument } from './schemas/group.schema';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: jest.Mocked<GroupsService>;

  const group = {
    _id: 'group-1',
    name: 'Roommates',
    owner: 'user-123',
    members: ['user-123', 'user-456'],
  } as unknown as GroupDocument;

  const req = { user: { uid: 'user-123' } } as AuthenticatedRequest;

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
    it('returns the groups visible to the caller', async () => {
      service.findAllForOwner.mockResolvedValue([group]);

      const result = await controller.findAllForOwner(req);

      expect(result).toEqual([group]);
      expect(service.findAllForOwner).toHaveBeenCalledWith('user-123');
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
    it('delegates to the service', async () => {
      service.getSummary.mockResolvedValue([]);

      const result = await controller.getSummary('group-1');

      expect(result).toEqual([]);
      expect(service.getSummary).toHaveBeenCalledWith('group-1');
    });
  });
});
