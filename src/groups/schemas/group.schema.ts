import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GroupCategory } from '../group-category.enum';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  owner: string;

  @Prop({ type: [String], default: [] })
  members: string[];

  @Prop({
    type: String,
    enum: GroupCategory,
    default: GroupCategory.OTHER,
    required: true,
  })
  category: GroupCategory;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
