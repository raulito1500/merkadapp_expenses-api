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
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "List expenses, optionally filtered by group or by the caller's private expenses",
  })
  @ApiOkResponse({ description: 'Expenses sorted by date, most recent first' })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: FindExpensesQueryDto,
  ) {
    return this.expensesService.findAll({
      groupId: query.groupId,
      owner: req.user.uid,
      personal: query.personal === 'true',
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new expense' })
  @ApiCreatedResponse({ description: 'Expense created successfully' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(createExpenseDto, req.user.uid);
  }

  @Patch(':id/group')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
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
