import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';

export abstract class GroupsRepository {
  abstract findById(id: string): Promise<GroupDocument | null>;
  abstract findVisibleToOwner(owner: string): Promise<GroupDocument[]>;
  abstract create(data: Partial<Group>): Promise<GroupDocument>;
  abstract updateById(
    id: string,
    data: Partial<Group>,
  ): Promise<GroupDocument | null>;
}

@Injectable()
export class GroupsMongoRepository implements GroupsRepository {
  constructor(
    @InjectModel(Group.name)
    private readonly groupModel: Model<GroupDocument>,
  ) {}

  findById(id: string): Promise<GroupDocument | null> {
    return this.groupModel.findById(id).exec();
  }

  findVisibleToOwner(owner: string): Promise<GroupDocument[]> {
    return this.groupModel
      .find({ $or: [{ owner }, { members: owner }] })
      .sort({ createdAt: 1 })
      .exec();
  }

  async create(data: Partial<Group>): Promise<GroupDocument> {
    const group = new this.groupModel(data);
    return group.save();
  }

  updateById(
    id: string,
    data: Partial<Group>,
  ): Promise<GroupDocument | null> {
    return this.groupModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }
}
