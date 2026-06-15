import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermissions('role.read')
  listRoles() {
    return this.service.listRoles();
  }

  @Get('permissions')
  @RequirePermissions('role.read')
  listPermissions() {
    return this.service.listPermissions();
  }
}
