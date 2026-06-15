import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermissions('role.read')
  @ApiOperation({ summary: 'List roles', description: 'Returns all system roles (OWNER, ADMIN, MANAGER, USER, VIEWER). Requires role.read permission.' })
  @ApiResponse({ status: 200, description: 'Array of system roles.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Missing role.read permission.' })
  listRoles() {
    return this.service.listRoles();
  }

  @Get('permissions')
  @RequirePermissions('role.read')
  @ApiOperation({ summary: 'List permissions', description: 'Returns all named permissions available in the system. Requires role.read permission.' })
  @ApiResponse({ status: 200, description: 'Array of permissions.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Missing role.read permission.' })
  listPermissions() {
    return this.service.listPermissions();
  }
}
