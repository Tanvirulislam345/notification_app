import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { DlqService } from '../queue/dlq.service';
import { UsersService } from '../users/users.service';
import { BatchNotificationDto } from './dto/batch-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationLog } from './entities/notification-log.entity';
import { ProducerService, ProduceResult } from './producer.service';

/** Thin orchestration facade over the producer, logs, and DLQ. */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly producer: ProducerService,
    private readonly users: UsersService,
    private readonly dlq: DlqService,
    @InjectRepository(NotificationLog)
    private readonly logs: Repository<NotificationLog>,
  ) {}

  async send(
    dto: SendNotificationDto,
    correlationId?: string,
  ): Promise<ProduceResult> {
    const input = {
      channel: dto.channel,
      templateName: dto.templateName,
      variables: dto.variables,
      body: dto.body,
      subject: dto.subject,
    };
    return dto.sync
      ? this.producer.produceSync(dto.userId, input, correlationId)
      : this.producer.produce(dto.userId, input, correlationId);
  }

  /** One notification to many recipients; shares a correlation id. */
  async batch(
    dto: BatchNotificationDto,
    correlationId = uuid(),
  ): Promise<ProduceResult[]> {
    let userIds = dto.userIds ?? [];
    if (dto.toAdmins) {
      const admins = await this.users.findAdmins();
      userIds = [...new Set([...userIds, ...admins.map((a) => a.id)])];
    }

    const input = {
      channel: dto.channel,
      templateName: dto.templateName,
      variables: dto.variables,
      body: dto.body,
      subject: dto.subject,
      isAdmin: !!dto.toAdmins,
    };

    return Promise.all(
      userIds.map((userId) =>
        this.producer.produce(userId, input, correlationId),
      ),
    );
  }

  history(userId: string): Promise<NotificationLog[]> {
    return this.logs.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  dlqList() {
    return this.dlq.list();
  }

  dlqRetry(id: string) {
    return this.dlq.retry(id);
  }
}
