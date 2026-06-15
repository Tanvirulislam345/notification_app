import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { UserSession } from './entities/user-session.entity';

interface CreateSessionDto {
  userId: string;
  organizationId: string;
  refreshToken: string;
  deviceInfo: Record<string, string>;
  ipAddress: string;
  expiresAt: Date;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(UserSession)
    private readonly repo: Repository<UserSession>,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createSession(dto: CreateSessionDto): Promise<string> {
    const session = await this.repo.save(
      this.repo.create({
        userId: dto.userId,
        organizationId: dto.organizationId,
        refreshTokenHash: this.hashToken(dto.refreshToken),
        deviceInfo: dto.deviceInfo,
        ipAddress: dto.ipAddress,
        lastActive: new Date(),
        expiresAt: dto.expiresAt,
      }),
    );
    return session.id;
  }

  async findByRefreshToken(token: string): Promise<UserSession | null> {
    const hash = this.hashToken(token);
    return this.repo.findOne({ where: { refreshTokenHash: hash } });
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.repo.delete({ id: sessionId });
  }

  async invalidateAllSessions(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.repo.update(sessionId, { lastActive: new Date() });
  }
}
