import { Injectable } from '@nestjs/common';
import { UsersRepository, UpsertUserData } from './users.repository';
import { UserDocument } from './schemas/user.schema';
import { UserSummary } from './dto/user-summary.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  upsert(data: UpsertUserData): Promise<UserDocument> {
    return this.usersRepository.upsert(data);
  }

  findAll(): Promise<UserDocument[]> {
    return this.usersRepository.findAll();
  }

  async resolveMany(uids: string[]): Promise<Map<string, UserSummary>> {
    const uniqueUids = Array.from(new Set(uids));
    const users = await this.usersRepository.findByUids(uniqueUids);
    const map = new Map<string, UserSummary>();
    for (const user of users) {
      map.set(user.uid, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    }
    return map;
  }

  resolveOne(map: Map<string, UserSummary>, uid: string): UserSummary {
    return map.get(uid) ?? { uid };
  }
}
