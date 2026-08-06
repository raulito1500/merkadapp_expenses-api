import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDocument } from './schemas/expense.schema';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let repository: jest.Mocked<ExpensesRepository>;

  const expense = {
    _id: '507f1f77bcf86cd799439011',
    description: 'Team dinner',
    amount: 85000,
    currency: 'COP',
    date: new Date('2026-06-30'),
    owner: 'Raul',
    paidBy: 'Raul',
    groupId: null,
  } as unknown as ExpenseDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: ExpensesRepository,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            updateGroupId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ExpensesService);
    repository = module.get(ExpensesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all expenses from the repository', async () => {
      repository.findAll.mockResolvedValue([expense]);

      const result = await service.findAll();

      expect(result).toEqual([expense]);
      expect(repository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('forwards a filter to the repository', async () => {
      repository.findAll.mockResolvedValue([expense]);

      await service.findAll({ groupId: 'group-1' });

      expect(repository.findAll).toHaveBeenCalledWith({ groupId: 'group-1' });
    });
  });

  describe('create', () => {
    it('delegates creation to the repository, defaulting groupId to null', async () => {
      const dto: CreateExpenseDto = {
        description: 'Team dinner',
        amount: 85000,
        currency: 'COP',
        date: '2026-06-30',
        owner: 'Raul',
        paidBy: 'Raul',
      };
      repository.create.mockResolvedValue(expense);

      const result = await service.create(dto);

      expect(result).toEqual(expense);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        groupId: null,
        date: new Date(dto.date),
      });
    });

    it('passes through an explicit groupId', async () => {
      const dto: CreateExpenseDto = {
        description: 'Team dinner',
        amount: 85000,
        currency: 'COP',
        date: '2026-06-30',
        owner: 'Raul',
        paidBy: 'Raul',
        groupId: 'group-1',
      };
      repository.create.mockResolvedValue(expense);

      await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        groupId: 'group-1',
        date: new Date(dto.date),
      });
    });
  });

  describe('move', () => {
    it('delegates to the repository', async () => {
      repository.updateGroupId.mockResolvedValue(expense);

      const result = await service.move('507f1f77bcf86cd799439011', 'group-1');

      expect(result).toEqual(expense);
      expect(repository.updateGroupId).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'group-1',
      );
    });
  });
});
