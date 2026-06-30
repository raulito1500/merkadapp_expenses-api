import { BadRequestException, Injectable } from '@nestjs/common';
import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { IngestExpenseDto } from './dto/ingest-expense.dto';
import { ExpenseDocument } from './schemas/expense.schema';

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  findAll(): Promise<ExpenseDocument[]> {
    return this.expensesRepository.findAll();
  }

  create(dto: CreateExpenseDto): Promise<ExpenseDocument> {
    return this.expensesRepository.create({ ...dto, date: new Date(dto.date) });
  }

  ingest(dto: IngestExpenseDto): Promise<ExpenseDocument> {
    const { amount, description, owner, merchant, ...rest } = dto;

    const parsedAmount = this.parseAmount(amount);

    // Anything that isn't a core expense field goes into metadata.
    // This automatically captures unknown future iOS fields without code changes.
    const metadata = Object.keys(rest).length > 0 ? rest : undefined;

    return this.expensesRepository.create({
      description,
      owner,
      merchant,
      amount: parsedAmount,
      currency: 'COP',
      date: new Date(),
      metadata,
    });
  }

  private parseAmount(raw: string): number {
    // Strip everything except digits, dots and commas
    const cleaned = raw.replace(/[^0-9.,]/g, '');

    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');

    let normalized: string;

    if (lastDot > lastComma) {
      const digitsAfterDot = cleaned.slice(lastDot + 1);
      if (digitsAfterDot.length === 3 && lastComma === -1) {
        // "59.900" → COP thousands separator → 59900
        normalized = cleaned.replace(/\./g, '');
      } else {
        // "59.90" or "1,234.56" → dot is decimal → keep as-is, strip commas
        normalized = cleaned.replace(/,/g, '');
      }
    } else if (lastComma > lastDot) {
      // "59,90" or "1.234,56" → comma is decimal separator (EU format)
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // No separator at all — plain integer
      normalized = cleaned;
    }

    const result = parseFloat(normalized);
    if (isNaN(result)) {
      throw new BadRequestException(`Cannot parse amount: "${raw}"`);
    }
    return result;
  }
}
