import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../common/enums';
import { User } from '../users/entities/user.entity';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserPreference } from './entities/user-preference.entity';

const SECONDS_PER_DAY = 86_400;

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly repo: Repository<UserPreference>,
  ) {}

  getForUser(userId: string): Promise<UserPreference[]> {
    return this.repo.find({
      where: { userId },
      order: { priority: 'ASC' },
    });
  }

  getPreference(
    userId: string,
    channel: Channel,
  ): Promise<UserPreference | null> {
    return this.repo.findOne({ where: { userId, channel } });
  }

  /** Upsert the supplied channel preferences for a user. */
  async update(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreference[]> {
    for (const item of dto.preferences) {
      const existing = await this.repo.findOne({
        where: { userId, channel: item.channel },
      });
      if (existing) {
        await this.repo.update(
          { id: existing.id },
          {
            optedIn: item.optedIn,
            quietHoursStart: item.quietHoursStart ?? null,
            quietHoursEnd: item.quietHoursEnd ?? null,
            priority: item.priority ?? existing.priority,
          },
        );
      } else {
        await this.repo.save(
          this.repo.create({
            userId,
            channel: item.channel,
            optedIn: item.optedIn,
            quietHoursStart: item.quietHoursStart ?? null,
            quietHoursEnd: item.quietHoursEnd ?? null,
            priority: item.priority ?? 100,
          }),
        );
      }
    }
    return this.getForUser(userId);
  }

  /** Seconds-of-day "now" in the given IANA timezone. */
  private secondsOfDayInTz(timezone: string, now: Date): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(now);
    const get = (t: string) =>
      parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
    let h = get('hour');
    if (h === 24) h = 0; // some runtimes emit "24" at midnight
    return h * 3600 + get('minute') * 60 + get('second');
  }

  private toSeconds(time: string): number {
    const [h, m, s] = time.split(':').map((n) => parseInt(n, 10));
    return h * 3600 + m * 60 + (s || 0);
  }

  /**
   * If the user is currently within quiet hours for this preference, returns
   * the delay (ms) until the window ends so the job can be DELAYED rather than
   * dropped. Returns 0 when not in quiet hours.
   */
  quietHoursDelayMs(
    user: User,
    pref: UserPreference,
    now: Date = new Date(),
  ): number {
    if (!pref.quietHoursStart || !pref.quietHoursEnd) return 0;

    const nowSec = this.secondsOfDayInTz(user.timezone, now);
    const startSec = this.toSeconds(pref.quietHoursStart);
    const endSec = this.toSeconds(pref.quietHoursEnd);
    if (startSec === endSec) return 0;

    const inWindow =
      startSec < endSec
        ? nowSec >= startSec && nowSec < endSec
        : nowSec >= startSec || nowSec < endSec; // wrap past midnight

    if (!inWindow) return 0;

    const secsUntilEnd =
      endSec > nowSec ? endSec - nowSec : SECONDS_PER_DAY - nowSec + endSec;
    return secsUntilEnd * 1000;
  }
}
