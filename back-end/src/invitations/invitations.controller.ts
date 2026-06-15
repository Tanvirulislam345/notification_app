import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, HttpCode } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { SendInvitationDto } from './dto/send-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly service: InvitationsService) {}

  @Post('send')
  @RequirePermissions('user.invite')
  sendInvitation(@Body() dto: SendInvitationDto, @CurrentUser() user: JwtPayload) {
    return this.service.sendInvitation(dto, user);
  }

  @Get()
  @RequirePermissions('invitation.manage')
  listInvitations(@CurrentUser() user: JwtPayload) {
    return this.service.listInvitations(user.organizationId);
  }

  @Delete(':id')
  @RequirePermissions('invitation.manage')
  revokeInvitation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.service.revokeInvitation(id, user);
  }

  @Public()
  @Post('accept')
  @HttpCode(200)
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.service.acceptInvitation(dto);
  }
}
