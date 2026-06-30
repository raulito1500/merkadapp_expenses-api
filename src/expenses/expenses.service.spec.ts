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
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('delegates creation to the repository with the given dto', async () => {
      const dto: CreateExpenseDto = {
        description: 'Team dinner',
        amount: 85000,
        currency: 'COP',
        date: '2026-06-30',
        owner: 'Raul',
      };
      repository.create.mockResolvedValue(expense);

      const result = await service.create(dto);

      expect(result).toEqual(expense);
      expect(repository.create).toHaveBeenCalledWith(dto);
    });
  });
});
