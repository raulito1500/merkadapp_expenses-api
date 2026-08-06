import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './schemas/group.schema';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsRepository, GroupsMongoRepository } from './groups.repository';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
    ExpensesModule,
  ],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    { provide: GroupsRepository, useClass: GroupsMongoRepository },
  ],
  exports: [GroupsService],
})
export class GroupsModule {}
