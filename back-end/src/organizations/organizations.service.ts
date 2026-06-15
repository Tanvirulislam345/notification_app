import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { UserOrganizationMembership } from './entities/user-organization-membership.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private readonly orgsRepo: Repository<Organization>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipsRepo: Repository<UserOrganizationMembership>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
  ) {}

  async findById(id: string): Promise<Organization> {
    const org = await this.orgsRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async listMembers(organizationId: string) {
    const memberships = await this.membershipsRepo.find({ where: { organizationId } });
    return Promise.all(
      memberships.map(async (m) => {
        const user = await this.usersRepo.findOne({ where: { id: m.userId } });
        const role = await this.rolesRepo.findOne({ where: { id: m.roleId } });
        return {
          userId: m.userId,
          email: user?.email,
          name: user?.name,
          role: role?.name,
          joinedAt: m.createdAt,
        };
      }),
    );
  }
}
