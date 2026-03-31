import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class AuthTransactionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Transactional()
  async create(loginId: string, hashedPassword: string) {
    const user = User.create(loginId, hashedPassword);
    return this.userRepository.save(user);
  }
}
