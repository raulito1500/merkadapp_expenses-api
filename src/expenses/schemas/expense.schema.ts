import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ required: true })
  description: string;

  @Prop()
  merchant?: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  owner: string;

  // Who actually paid for the expense, used by the group balance summary.
  @Prop({ required: true })
  paidBy: string;

  // null = private expense, only visible to its owner. Set = shared with the group's members.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Group', default: null })
  groupId: MongooseSchema.Types.ObjectId | null;

  // Flexible bag for fields from external sources (GPS, card info, transaction status, etc.)
  // Uses Mixed type so any shape can be stored without schema changes.
  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
