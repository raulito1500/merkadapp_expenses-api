import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
