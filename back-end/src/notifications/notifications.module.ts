import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferencesModule } from '../preferences/preferences.module';
import { TemplatesModule } from '../templates/templates.module';
import { UsersModule } from '../users/users.module';
import { ChannelResolver } from './channels/channel-resolver.service';
import { InAppChannel } from './channels/inapp.channel';
import { NodemailerChannel } from './channels/nodemailer.channel';
import { SendgridChannel } from './channels/sendgrid.channel';
import { NotificationLog } from './entities/notification-log.entity';
import { InAppGateway } from './inapp.gateway';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ProducerService } from './producer.service';
import { EmailWorker } from './workers/email.worker';
import { InAppWorker } from './workers/inapp.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog]),
    UsersModule,
    PreferencesModule,
    TemplatesModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ProducerService,
    // channels (adapter pattern) + resolver
    SendgridChannel,
    NodemailerChannel,
    InAppChannel,
    ChannelResolver,
    // realtime gateway
    InAppGateway,
    // queue consumers
    EmailWorker,
    InAppWorker,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
