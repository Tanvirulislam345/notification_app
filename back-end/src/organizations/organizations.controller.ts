import { Controller, Get } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get('me')
  getMyOrganization(@CurrentUser() user: JwtPayload) {
    return this.service.findById(user.organizationId);
  }

  @Get('members')
  listMembers(@CurrentUser() user: JwtPayload) {
    return this.service.listMembers(user.organizationId);
  }
}
