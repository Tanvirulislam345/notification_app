import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { RolesService } from '../../roles/roles.service';
import { JwtPayload } from '../../auth/strategies/jwt-access.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user: JwtPayload = context.switchToHttp().getRequest().user;
    if (!user?.roleId) return false;

    for (const perm of required) {
      const allowed = await this.rolesService.hasPermission(user.roleId, perm);
      if (!allowed) return false;
    }
    return true;
  }
}
