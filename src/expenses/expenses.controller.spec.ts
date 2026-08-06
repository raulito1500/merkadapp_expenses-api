import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { FindExpensesQueryDto } from './dto/find-expenses-query.dto';
import { ExpenseDocument } from './schemas/expense.schema';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: jest.Mocked<ExpensesService>;

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
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            move: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ExpensesController);
    service = module.get(ExpensesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the expenses provided by the service', async () => {
      service.findAll.mockResolvedValue([expense]);
      const query: FindExpensesQueryDto = {};

      const result = await controller.findAll(query);

      expect(result).toEqual([expense]);
      expect(service.findAll).toHaveBeenCalledWith({
        groupId: undefined,
        owner: undefined,
        personal: false,
      });
    });

    it('translates the personal query param to a boolean', async () => {
      service.findAll.mockResolvedValue([expense]);

      await controller.findAll({ owner: 'Raul', personal: 'true' });

      expect(service.findAll).toHaveBeenCalledWith({
        groupId: undefined,
        owner: 'Raul',
        personal: true,
      });
    });
  });

  describe('create', () => {
    it('delegates creation to the service with the given dto', async () => {
      const dto: CreateExpenseDto = {
        description: 'Team dinner',
        amount: 85000,
        currency: 'COP',
        date: '2026-06-30',
        owner: 'Raul',
        paidBy: 'Raul',
      };
      service.create.mockResolvedValue(expense);

      const result = await controller.create(dto);

      expect(result).toEqual(expense);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('move', () => {
    it('delegates to the service, defaulting groupId to null', async () => {
      service.move.mockResolvedValue(expense);

      const result = await controller.move('507f1f77bcf86cd799439011', {});

      expect(result).toEqual(expense);
      expect(service.move).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        null,
      );
    });
  });
});
