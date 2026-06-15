import { IsEmail, IsUUID } from 'class-validator';

export class SendInvitationDto {
  @IsEmail()
  email: string;

  @IsUUID()
  roleId: string;
}
