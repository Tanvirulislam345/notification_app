import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Channel } from '../../common/enums';

/**
 * Send one notification to many recipients in a single producer call.
 * Provide explicit `userIds`, or set `toAdmins` to target every admin user.
 */
export class BatchNotificationDto {
  @ValidateIf((o) => !o.toAdmins)
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @IsOptional()
  @IsBoolean()
  toAdmins?: boolean;

  @IsEnum(Channel)
  channel: Channel;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  subject?: string;
}
