import type { UserEntity } from './user.entity';

export abstract class IUserReaderRepo {
  abstract findByUsername(username: string): Promise<UserEntity | null>;
}
