import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'uuid-invitation-token-from-email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'Bob Jones', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Password123!', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
