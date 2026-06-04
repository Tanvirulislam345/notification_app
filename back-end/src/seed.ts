import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { Channel } from './common/enums';
import { User } from './users/entities/user.entity';
import { UserPreference } from './preferences/entities/user-preference.entity';
import { NotificationTemplate } from './templates/entities/notification-template.entity';

/**
 * Idempotent dev seed: a regular user, an admin user, their channel
 * preferences, and the two templates used by the item-confirmation flow.
 *
 * Run with: npm run seed
 */
async function seed() {
  await AppDataSource.initialize();

  const users = AppDataSource.getRepository(User);
  const prefs = AppDataSource.getRepository(UserPreference);
  const templates = AppDataSource.getRepository(NotificationTemplate);

  // ── Users ──────────────────────────────────────────────────────────────
  const upsertUser = async (data: Partial<User>) => {
    let user = await users.findOne({ where: { email: data.email } });
    if (!user) {
      user = users.create(data);
      user = await users.save(user);
      console.log(`+ user ${user.email} (${user.id})`);
    }
    return user;
  };

  const devUser = await upsertUser({
    email: 'dev@example.com',
    name: 'Dev User',
    timezone: 'Asia/Dhaka',
    isAdmin: false,
  });

  const adminUser = await upsertUser({
    email: 'admin@example.com',
    name: 'Admin User',
    timezone: 'Asia/Dhaka',
    isAdmin: true,
  });

  // ── Preferences (opted-in on EMAIL + IN_APP, no quiet hours) ────────────
  const upsertPref = async (userId: string, channel: Channel, priority: number) => {
    const existing = await prefs.findOne({ where: { userId, channel } });
    if (!existing) {
      await prefs.save(
        prefs.create({ userId, channel, optedIn: true, priority }),
      );
    }
  };

  for (const u of [devUser, adminUser]) {
    await upsertPref(u.id, Channel.EMAIL, 100);
    await upsertPref(u.id, Channel.IN_APP, 50);
  }

  // ── Templates ───────────────────────────────────────────────────────────
  const upsertTemplate = async (data: Partial<NotificationTemplate>) => {
    const existing = await templates.findOne({
      where: { name: data.name, channel: data.channel },
    });
    if (!existing) {
      await templates.save(templates.create(data));
      console.log(`+ template ${data.name} (${data.channel})`);
    }
  };

  await upsertTemplate({
    name: 'order_confirmed',
    channel: Channel.EMAIL,
    subject: 'Your order {{orderId}} is confirmed',
    bodyTemplate:
      'Hi {{firstName}},\n\nYour order {{orderId}} with {{itemCount}} item(s) has been confirmed.\n\nThanks!',
  });

  await upsertTemplate({
    name: 'admin_bulk_action',
    channel: Channel.IN_APP,
    subject: null,
    bodyTemplate:
      '{{firstName}} confirmed {{itemCount}} item(s) (order {{orderId}}).',
  });

  console.log('\nSeed complete.');
  console.log(`  Dev user id   : ${devUser.id}`);
  console.log(`  Admin user id : ${adminUser.id}`);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
