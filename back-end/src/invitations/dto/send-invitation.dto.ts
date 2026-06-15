import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUUID } from 'class-validator';

export class SendInvitationDto {
  @ApiProperty({ example: 'bob@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID of the role to assign' })
  @IsUUID()
  roleId: string;
}
