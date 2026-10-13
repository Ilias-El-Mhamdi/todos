import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserReaderRepo } from '../../../core/repos/user/user.reader.abstract-repo';
import { UserEntity } from '../../../core/repos/user/user.entity';

@Injectable()
export class UserRepo implements IUserReaderRepo {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findByUsername(username: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { username } });
  }
}
