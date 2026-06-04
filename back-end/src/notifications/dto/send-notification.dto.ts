import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Channel } from '../../common/enums';

export class SendNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(Channel)
  channel: Channel;

  /** Named template to render. Omit to send `body`/`subject` directly. */
  @IsOptional()
  @IsString()
  templateName?: string;

  /** Variables for `{{interpolation}}`. */
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;

  /** Ad-hoc body when no template is used. */
  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  /** Bypass the queue for time-sensitive sends (OTPs/alerts). */
  @IsOptional()
  @IsBoolean()
  sync?: boolean;
}
