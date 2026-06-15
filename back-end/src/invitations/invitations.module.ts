import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { User } from '../users/entities/user.entity';
import { UserOrganizationMembership } from '../organizations/entities/user-organization-membership.entity';
import { Role } from '../roles/entities/role.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { MailModule } from '../mail/mail.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, User, UserOrganizationMembership, Role, Organization]),
    MailModule,
    AuditLogsModule,
  ],
  providers: [InvitationsService],
  controllers: [InvitationsController],
})
export class InvitationsModule {}
