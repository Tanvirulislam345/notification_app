import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { CommonModule } from './common/common.module';
import { RedisModule } from './common/redis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PreferencesModule } from './preferences/preferences.module';
import { QueueModule } from './queue/queue.module';
import { TemplatesModule } from './templates/templates.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.user'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.name'),
        autoLoadEntities: true,
        synchronize: false,
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    RedisModule,
    CommonModule,
    QueueModule,
    UsersModule,
    PreferencesModule,
    TemplatesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
