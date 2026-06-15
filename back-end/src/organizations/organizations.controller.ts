import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my organization', description: 'Returns the organization (tenant) that the authenticated user belongs to.' })
  @ApiResponse({ status: 200, description: 'Organization details.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  getMyOrganization(@CurrentUser() user: JwtPayload) {
    return this.service.findById(user.organizationId);
  }

  @Get('members')
  @ApiOperation({ summary: 'List organization members', description: 'Returns all users who are members of the authenticated user\'s organization, including their role.' })
  @ApiResponse({ status: 200, description: 'Array of members with name, email, role, and join date.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  listMembers(@CurrentUser() user: JwtPayload) {
    return this.service.listMembers(user.organizationId);
  }
}
