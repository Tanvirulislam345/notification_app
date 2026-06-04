import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repo.find({ where: { id: In(ids) } });
  }

  findAdmins(): Promise<User[]> {
    return this.repo.find({ where: { isAdmin: true } });
  }

  findAll(): Promise<User[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }
}
