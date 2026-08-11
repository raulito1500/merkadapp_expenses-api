import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from './schemas/expense.schema';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import {
  ExpensesRepository,
  ExpensesMongoRepository,
} from './expenses.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    UsersModule,
  ],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    { provide: ExpensesRepository, useClass: ExpensesMongoRepository },
  ],
  exports: [ExpensesService],
})
export class ExpensesModule {}
