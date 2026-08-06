import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from './schemas/expense.schema';

export interface FindExpensesFilter {
  groupId?: string;
  owner?: string;
  personal?: boolean;
}

export abstract class ExpensesRepository {
  abstract findAll(filter?: FindExpensesFilter): Promise<ExpenseDocument[]>;
  abstract create(data: Partial<Expense>): Promise<ExpenseDocument>;
  abstract updateGroupId(
    id: string,
    groupId: string | null,
  ): Promise<ExpenseDocument | null>;
}

@Injectable()
export class ExpensesMongoRepository implements ExpensesRepository {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async findAll(filter: FindExpensesFilter = {}): Promise<ExpenseDocument[]> {
    const query: Record<string, unknown> = {};
    if (filter.groupId) {
      query.groupId = filter.groupId;
    } else if (filter.personal && filter.owner) {
      query.groupId = null;
      query.owner = filter.owner;
    }
    return this.expenseModel.find(query).sort({ date: -1 }).exec();
  }

  async create(data: Partial<Expense>): Promise<ExpenseDocument> {
    const expense = new this.expenseModel(data);
    return expense.save();
  }

  updateGroupId(
    id: string,
    groupId: string | null,
  ): Promise<ExpenseDocument | null> {
    return this.expenseModel
      .findByIdAndUpdate(id, { groupId }, { new: true })
      .exec();
  }
}
