import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Channel } from '../../common/enums';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class PreferenceItemDto {
  @IsEnum(Channel)
  channel: Channel;

  @IsBoolean()
  optedIn: boolean;

  @IsOptional()
  @Matches(TIME_RE, { message: 'quietHoursStart must be HH:mm or HH:mm:ss' })
  quietHoursStart?: string | null;

  @IsOptional()
  @Matches(TIME_RE, { message: 'quietHoursEnd must be HH:mm or HH:mm:ss' })
  quietHoursEnd?: string | null;

  @IsOptional()
  @IsInt()
  priority?: number;
}

export class UpdatePreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceItemDto)
  preferences: PreferenceItemDto[];
}
