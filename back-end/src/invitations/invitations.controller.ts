import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { SendInvitationDto } from './dto/send-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly service: InvitationsService) {}

  @Post('send')
  @RequirePermissions('user.invite')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send invitation', description: 'Sends an email invitation to join the organization. Requires the user.invite permission (OWNER or ADMIN).' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Missing user.invite permission.' })
  @ApiResponse({ status: 409, description: 'User is already a member or a pending invitation already exists.' })
  sendInvitation(@Body() dto: SendInvitationDto, @CurrentUser() user: JwtPayload) {
    return this.service.sendInvitation(dto, user);
  }

  @Get()
  @RequirePermissions('invitation.manage')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List invitations', description: 'Returns all invitations (any status) for the authenticated user\'s organization. Requires invitation.manage permission.' })
  @ApiResponse({ status: 200, description: 'Array of invitations.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Missing invitation.manage permission.' })
  listInvitations(@CurrentUser() user: JwtPayload) {
    return this.service.listInvitations(user.organizationId);
  }

  @Delete(':id')
  @RequirePermissions('invitation.manage')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke invitation', description: 'Marks a pending invitation as revoked. Requires invitation.manage permission.' })
  @ApiParam({ name: 'id', description: 'UUID of the invitation to revoke.' })
  @ApiResponse({ status: 200, description: 'Invitation revoked.' })
  @ApiResponse({ status: 400, description: 'Invitation is not in pending status.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Missing permission or invitation belongs to another org.' })
  @ApiResponse({ status: 404, description: 'Invitation not found.' })
  revokeInvitation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.service.revokeInvitation(id, user);
  }

  @Public()
  @Post('accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Accept invitation', description: 'Accepts an invitation using the token from the invitation email. Creates the user account if it does not exist.' })
  @ApiResponse({ status: 200, description: 'Invitation accepted — user can now log in.' })
  @ApiResponse({ status: 400, description: 'Token invalid, already used, or invitation has expired.' })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.service.acceptInvitation(dto);
  }
}
