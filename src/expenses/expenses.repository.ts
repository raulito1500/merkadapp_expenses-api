import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from './schemas/expense.schema';
import { CreateExpenseDto } from './dto/create-expense.dto';

export abstract class ExpensesRepository {
  abstract findAll(): Promise<ExpenseDocument[]>;
  abstract create(dto: CreateExpenseDto): Promise<ExpenseDocument>;
}

@Injectable()
export class ExpensesMongoRepository implements ExpensesRepository {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async findAll(): Promise<ExpenseDocument[]> {
    return this.expenseModel.find().sort({ date: -1 }).exec();
  }

  async create(dto: CreateExpenseDto): Promise<ExpenseDocument> {
    const expense = new this.expenseModel(dto);
    return expense.save();
  }
}
