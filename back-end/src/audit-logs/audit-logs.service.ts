import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(
    organizationId: string | null,
    userId: string | null,
    action: string,
    entity?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.repo.save(
      this.repo.create({ organizationId, userId, action, entity, metadata }),
    );
  }
}
