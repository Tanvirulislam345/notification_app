import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { BatchNotificationDto } from './dto/batch-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('send')
  send(@Body() dto: SendNotificationDto, @Req() req: Request) {
    return this.notifications.send(dto, (req as any).correlationId);
  }

  @Post('batch')
  batch(@Body() dto: BatchNotificationDto, @Req() req: Request) {
    return this.notifications.batch(dto, (req as any).correlationId);
  }

  // ── DLQ (admin) — declared before :userId so the literal path wins ──
  @Get('dlq')
  dlqList() {
    return this.notifications.dlqList();
  }

  @Post('dlq/:id/retry')
  dlqRetry(@Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.dlqRetry(id);
  }

  @Get(':userId')
  history(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notifications.history(userId);
  }
}
