import { AppDataSource } from './data-source';
import { Role } from './roles/entities/role.entity';
import { Permission } from './roles/entities/permission.entity';
import { RolePermission } from './roles/entities/role-permission.entity';

const SYSTEM_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'USER', 'VIEWER'];

const ALL_PERMISSIONS = [
  'user.invite',
  'user.read',
  'user.manage',
  'invitation.manage',
  'role.read',
  'role.manage',
  'organization.read',
  'organization.manage',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ['user.invite', 'user.read', 'user.manage', 'invitation.manage', 'role.read', 'organization.read'],
  MANAGER: ['user.read', 'invitation.manage', 'role.read', 'organization.read'],
  USER: ['user.read', 'organization.read'],
  VIEWER: ['user.read', 'organization.read'],
};

async function seed() {
  await AppDataSource.initialize();
  const rolesRepo = AppDataSource.getRepository(Role);
  const permsRepo = AppDataSource.getRepository(Permission);
  const rpRepo = AppDataSource.getRepository(RolePermission);

  const permMap: Record<string, string> = {};
  for (const name of ALL_PERMISSIONS) {
    let perm = await permsRepo.findOne({ where: { name } });
    if (!perm) {
      perm = await permsRepo.save(permsRepo.create({ name }));
      console.log(`Created permission: ${name}`);
    }
    permMap[name] = perm.id;
  }

  for (const roleName of SYSTEM_ROLES) {
    let role = await rolesRepo.findOne({ where: { name: roleName, organizationId: null } });
    if (!role) {
      role = await rolesRepo.save(rolesRepo.create({ name: roleName, organizationId: null }));
      console.log(`Created role: ${roleName}`);
    }
    for (const permName of ROLE_PERMISSIONS[roleName] ?? []) {
      const exists = await rpRepo.findOne({ where: { roleId: role.id, permissionId: permMap[permName] } });
      if (!exists) {
        await rpRepo.save(rpRepo.create({ roleId: role.id, permissionId: permMap[permName] }));
      }
    }
  }

  console.log('Seed complete.');
  await AppDataSource.destroy();
}

seed().catch((e) => { console.error(e); process.exit(1); });
