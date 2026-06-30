import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from './schemas/expense.schema';

export abstract class ExpensesRepository {
  abstract findAll(): Promise<ExpenseDocument[]>;
  abstract create(data: Partial<Expense>): Promise<ExpenseDocument>;
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

  async create(data: Partial<Expense>): Promise<ExpenseDocument> {
    const expense = new this.expenseModel(data);
    return expense.save();
  }
}
