import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { Invitation } from './entities/invitation.entity';
import { User } from '../users/entities/user.entity';
import { UserOrganizationMembership } from '../organizations/entities/user-organization-membership.entity';
import { Role } from '../roles/entities/role.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { MailService } from '../mail/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ConfigService } from '@nestjs/config';
import { SendInvitationDto } from './dto/send-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation) private readonly invitationsRepo: Repository<Invitation>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipsRepo: Repository<UserOrganizationMembership>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Organization) private readonly orgsRepo: Repository<Organization>,
    private readonly mailService: MailService,
    private readonly auditLogs: AuditLogsService,
    private readonly config: ConfigService,
  ) {}

  async sendInvitation(dto: SendInvitationDto, actor: JwtPayload): Promise<{ message: string }> {
    const invitee = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (invitee) {
      const isMember = await this.membershipsRepo.findOne({
        where: { userId: invitee.id, organizationId: actor.organizationId },
      });
      if (isMember) throw new ConflictException('User is already a member of this organization');
    }

    const existingInvite = await this.invitationsRepo.findOne({
      where: { email: dto.email, organizationId: actor.organizationId, status: 'pending' },
    });
    if (existingInvite) throw new ConflictException('Pending invitation already exists for this email');

    const role = await this.rolesRepo.findOne({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const org = await this.orgsRepo.findOne({ where: { id: actor.organizationId } });
    const token = randomUUID();
    const ttl: number = this.config.get('invitationTtlDays') ?? 7;

    await this.invitationsRepo.save(
      this.invitationsRepo.create({
        email: dto.email,
        organizationId: actor.organizationId,
        roleId: dto.roleId,
        token,
        status: 'pending',
        expiresAt: new Date(Date.now() + ttl * 24 * 60 * 60 * 1000),
        createdBy: actor.sub,
      }),
    );

    await this.mailService.sendInvitationEmail(dto.email, org.name, token);
    await this.auditLogs.log(actor.organizationId, actor.sub, 'invitation.sent', 'invitation', { email: dto.email });

    return { message: 'Invitation sent successfully' };
  }

  async listInvitations(organizationId: string): Promise<Invitation[]> {
    return this.invitationsRepo.find({ where: { organizationId } });
  }

  async revokeInvitation(id: string, actor: JwtPayload): Promise<{ message: string }> {
    const invite = await this.invitationsRepo.findOne({ where: { id } });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.organizationId !== actor.organizationId) throw new ForbiddenException();
    if (invite.status !== 'pending') throw new BadRequestException('Invitation is not pending');

    await this.invitationsRepo.update(id, { status: 'revoked' });
    return { message: 'Invitation revoked' };
  }

  async acceptInvitation(dto: AcceptInvitationDto): Promise<{ message: string }> {
    const invite = await this.invitationsRepo.findOne({ where: { token: dto.token } });
    if (!invite || invite.status !== 'pending')
      throw new BadRequestException('Invalid or already used invitation');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('Invitation has expired');

    let user = await this.usersRepo.findOne({ where: { email: invite.email } });
    if (!user) {
      const passwordHash = await argon2.hash(dto.password);
      user = await this.usersRepo.save(
        this.usersRepo.create({
          name: dto.name,
          email: invite.email,
          passwordHash,
          isEmailVerified: true,
        }),
      );
    }

    await this.membershipsRepo.save(
      this.membershipsRepo.create({
        userId: user.id,
        organizationId: invite.organizationId,
        roleId: invite.roleId,
      }),
    );

    await this.invitationsRepo.update(invite.id, { status: 'accepted' });
    await this.auditLogs.log(invite.organizationId, user.id, 'invitation.accepted', 'user', { email: invite.email });

    return { message: 'Invitation accepted. You can now log in.' };
  }
}
