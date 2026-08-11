import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { UsersService } from '../users/users.service';
import { UserSummary } from '../users/dto/user-summary.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { FindExpensesQueryDto } from './dto/find-expenses-query.dto';
import { ExpenseDocument } from './schemas/expense.schema';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: jest.Mocked<ExpensesService>;
  let usersService: jest.Mocked<UsersService>;

  const rawExpense = {
    _id: '507f1f77bcf86cd799439011',
    description: 'Team dinner',
    amount: 85000,
    currency: 'COP',
    date: new Date('2026-06-30'),
    owner: 'user-123',
    paidBy: 'user-456',
    groupId: null,
  };
  const expense = {
    ...rawExpense,
    toObject: () => rawExpense,
  } as unknown as ExpenseDocument;

  const req = { user: { uid: 'user-123' } } as AuthenticatedRequest;

  const ownerSummary: UserSummary = { uid: 'user-123', displayName: 'Raul' };
  const paidBySummary: UserSummary = { uid: 'user-456', displayName: 'Manu' };
  const usersByUid = new Map<string, UserSummary>([
    ['user-123', ownerSummary],
    ['user-456', paidBySummary],
  ]);

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

    controller = module.get(ExpensesController);
    service = module.get(ExpensesService);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the expenses enriched with owner/paidBy user summaries', async () => {
      service.findAll.mockResolvedValue([expense]);
      const query: FindExpensesQueryDto = {};

      const result = await controller.findAll(req, query);

      expect(result).toEqual([
        { ...rawExpense, owner: ownerSummary, paidBy: paidBySummary },
      ]);
      expect(service.findAll).toHaveBeenCalledWith({
        groupId: undefined,
        owner: 'user-123',
        personal: false,
      });
      expect(usersService.resolveMany).toHaveBeenCalledWith([
        'user-123',
        'user-456',
      ]);
    });

    it('translates the personal query param to a boolean', async () => {
      service.findAll.mockResolvedValue([expense]);

      await controller.findAll(req, { personal: 'true' });

      expect(service.findAll).toHaveBeenCalledWith({
        groupId: undefined,
        owner: 'user-123',
        personal: true,
      });
    });
  });

  describe('create', () => {
    it('delegates creation to the service with the caller as owner', async () => {
      const dto: CreateExpenseDto = {
        description: 'Team dinner',
        amount: 85000,
        currency: 'COP',
        date: '2026-06-30',
        paidBy: 'user-456',
      };
      service.create.mockResolvedValue(expense);

      const result = await controller.create(req, dto);

      expect(result).toEqual(expense);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-123');
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
