import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { ExpensesService } from '../expenses/expenses.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDocument } from './schemas/group.schema';
import { ExpenseDocument } from '../expenses/schemas/expense.schema';

describe('GroupsService', () => {
  let service: GroupsService;
  let groupsRepository: jest.Mocked<GroupsRepository>;
  let expensesService: jest.Mocked<ExpensesService>;

  const group = {
    _id: 'group-1',
    name: 'Roommates',
    owner: 'Raul',
    members: ['Raul', 'Manu', 'Diana'],
  } as unknown as GroupDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: GroupsRepository,
          useValue: {
            findById: jest.fn(),
            findVisibleToOwner: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: ExpensesService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(GroupsService);
    groupsRepository = module.get(GroupsRepository);
    expensesService = module.get(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('dedupes the owner into the members list', async () => {
      const dto: CreateGroupDto = {
        name: 'Roommates',
        members: ['Manu', 'Raul', 'Diana'],
      };
      groupsRepository.create.mockResolvedValue(group);

      await service.create(dto, 'Raul');

      expect(groupsRepository.create).toHaveBeenCalledWith({
        ...dto,
        owner: 'Raul',
        members: ['Raul', 'Manu', 'Diana'],
      });
    });
  });

  describe('getSummary', () => {
    it('throws when the group does not exist', async () => {
      groupsRepository.findById.mockResolvedValue(null);

      await expect(service.getSummary('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('splits totals equally across members and computes each balance', async () => {
      groupsRepository.findById.mockResolvedValue(group);
      expensesService.findAll.mockResolvedValue([
        { currency: 'COP', amount: 90000, paidBy: 'Raul' },
        { currency: 'COP', amount: 30000, paidBy: 'Manu' },
      ] as unknown as ExpenseDocument[]);

      const summary = await service.getSummary('group-1');

      expect(summary).toEqual([
        {
          currency: 'COP',
          total: 120000,
          perPersonShare: 40000,
          members: [
            { uid: 'Raul', paid: 90000, balance: 50000 },
            { uid: 'Manu', paid: 30000, balance: -10000 },
            { uid: 'Diana', paid: 0, balance: -40000 },
          ],
        },
      ]);
    });
  });
});
