import { Injectable } from '@nestjs/common';
import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDocument } from './schemas/expense.schema';

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  findAll(): Promise<ExpenseDocument[]> {
    return this.expensesRepository.findAll();
  }

  create(dto: CreateExpenseDto): Promise<ExpenseDocument> {
    return this.expensesRepository.create(dto);
  }
}
