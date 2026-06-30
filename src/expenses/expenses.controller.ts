import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { IngestExpenseDto } from './dto/ingest-expense.dto';

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all expenses' })
  @ApiOkResponse({ description: 'Expenses sorted by date, most recent first' })
  findAll() {
    return this.expensesService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new expense' })
  @ApiCreatedResponse({ description: 'Expense created successfully' })
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  // Override global ValidationPipe for this route only:
  // - whitelist: false  → unknown fields are NOT stripped (needed for open-ended metadata)
  // - transform: true   → class-validator decorators still run on declared fields
  @UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
  @ApiOperation({ summary: 'Ingest an expense from an external source (e.g. iOS Wallet)' })
  @ApiBody({ type: IngestExpenseDto })
  @ApiCreatedResponse({ description: 'External expense ingested and normalized successfully' })
  ingest(@Body() dto: IngestExpenseDto) {
    return this.expensesService.ingest(dto);
  }
}
