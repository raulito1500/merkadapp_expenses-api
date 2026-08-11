import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface UpsertUserData {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

export abstract class UsersRepository {
  abstract upsert(data: UpsertUserData): Promise<UserDocument>;
  abstract findAll(): Promise<UserDocument[]>;
  abstract findByUids(uids: string[]): Promise<UserDocument[]>;
}

@Injectable()
export class UsersMongoRepository implements UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  upsert(data: UpsertUserData): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate(
        { uid: data.uid },
        {
          $set: {
            email: data.email,
            displayName: data.displayName,
            photoURL: data.photoURL,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ displayName: 1 }).exec();
  }

  findByUids(uids: string[]): Promise<UserDocument[]> {
    return this.userModel.find({ uid: { $in: uids } }).exec();
  }
}
