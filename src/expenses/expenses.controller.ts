import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
import { FindExpensesQueryDto } from './dto/find-expenses-query.dto';
import { MoveExpenseDto } from './dto/move-expense.dto';

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "List expenses, optionally filtered by group or by an owner's private expenses",
  })
  @ApiOkResponse({ description: 'Expenses sorted by date, most recent first' })
  findAll(@Query() query: FindExpensesQueryDto) {
    return this.expensesService.findAll({
      groupId: query.groupId,
      owner: query.owner,
      personal: query.personal === 'true',
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new expense' })
  @ApiCreatedResponse({ description: 'Expense created successfully' })
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  @Patch(':id/group')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Move an expense to a different group, or back to private (groupId: null)',
  })
  move(@Param('id') id: string, @Body() dto: MoveExpenseDto) {
    return this.expensesService.move(id, dto.groupId ?? null);
  }

  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  // Override global ValidationPipe for this route only:
  // - whitelist: false  → unknown fields are NOT stripped (needed for open-ended metadata)
  // - transform: true   → class-validator decorators still run on declared fields
  @UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
  @ApiOperation({
    summary: 'Ingest an expense from an external source (e.g. iOS Wallet)',
  })
  @ApiBody({ type: IngestExpenseDto })
  @ApiCreatedResponse({
    description: 'External expense ingested and normalized successfully',
  })
  ingest(@Body() dto: IngestExpenseDto) {
    return this.expensesService.ingest(dto);
  }
}
