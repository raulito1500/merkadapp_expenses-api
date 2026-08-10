import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDocument } from './schemas/group.schema';
import {
  GroupCurrencySummary,
  GroupMemberBalance,
} from './dto/group-summary.dto';
import { ExpensesService } from '../expenses/expenses.service';
import { ExpenseDocument } from '../expenses/schemas/expense.schema';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly expensesService: ExpensesService,
  ) {}

  create(dto: CreateGroupDto, owner: string): Promise<GroupDocument> {
    const members = Array.from(new Set([owner, ...(dto.members ?? [])]));
    return this.groupsRepository.create({ ...dto, owner, members });
  }

  findOne(id: string): Promise<GroupDocument | null> {
    return this.groupsRepository.findById(id);
  }

  findAllForOwner(owner: string): Promise<GroupDocument[]> {
    return this.groupsRepository.findVisibleToOwner(owner);
  }

  async getSummary(id: string): Promise<GroupCurrencySummary[]> {
    const group = await this.groupsRepository.findById(id);
    if (!group) {
      throw new NotFoundException(`Group ${id} not found`);
    }
    const expenses = await this.expensesService.findAll({ groupId: id });
    return this.computeSummary(group, expenses);
  }

  private computeSummary(
    group: GroupDocument,
    expenses: ExpenseDocument[],
  ): GroupCurrencySummary[] {
    const byCurrency = new Map<string, ExpenseDocument[]>();
    for (const expense of expenses) {
      const list = byCurrency.get(expense.currency) ?? [];
      list.push(expense);
      byCurrency.set(expense.currency, list);
    }

    return Array.from(byCurrency.entries()).map(([currency, list]) => {
      const total = list.reduce((sum, expense) => sum + expense.amount, 0);
      const perPersonShare =
        group.members.length > 0 ? total / group.members.length : 0;
      const members: GroupMemberBalance[] = group.members.map((name) => {
        const paid = list
          .filter((expense) => expense.paidBy === name)
          .reduce((sum, expense) => sum + expense.amount, 0);
        return { name, paid, balance: paid - perPersonShare };
      });
      return { currency, total, perPersonShare, members };
    });
  }
}
