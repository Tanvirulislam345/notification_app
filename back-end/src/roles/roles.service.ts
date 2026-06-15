import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permsRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rpRepo: Repository<RolePermission>,
  ) {}

  findSystemRoleByName(name: string): Promise<Role | null> {
    return this.rolesRepo.findOne({ where: { name, organizationId: null } });
  }

  listRoles(): Promise<Role[]> {
    return this.rolesRepo.find({ where: { organizationId: null } });
  }

  listPermissions(): Promise<Permission[]> {
    return this.permsRepo.find();
  }

  async getPermissionsForRole(roleId: string): Promise<string[]> {
    const rps = await this.rpRepo.find({ where: { roleId } });
    if (!rps.length) return [];
    const permIds = rps.map((rp) => rp.permissionId);
    const perms = await this.permsRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: permIds })
      .getMany();
    return perms.map((p) => p.name);
  }

  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    const perms = await this.getPermissionsForRole(roleId);
    return perms.includes(permission);
  }
}
