import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDocument } from './schemas/group.schema';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: jest.Mocked<GroupsService>;

  const group = {
    _id: 'group-1',
    name: 'Roommates',
    owner: 'Raul',
    members: ['Raul', 'Manu'],
  } as unknown as GroupDocument;

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
    }).compile();

    controller = module.get(GroupsController);
    service = module.get(GroupsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllForOwner', () => {
    it('returns the groups visible to the given owner', async () => {
      service.findAllForOwner.mockResolvedValue([group]);

      const result = await controller.findAllForOwner({ owner: 'Raul' });

      expect(result).toEqual([group]);
      expect(service.findAllForOwner).toHaveBeenCalledWith('Raul');
    });
  });

  describe('create', () => {
    it('delegates creation to the service with the given dto', async () => {
      const dto: CreateGroupDto = {
        name: 'Roommates',
        owner: 'Raul',
        members: ['Manu'],
      };
      service.create.mockResolvedValue(group);

      const result = await controller.create(dto);

      expect(result).toEqual(group);
      expect(service.create).toHaveBeenCalledWith(dto);
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
