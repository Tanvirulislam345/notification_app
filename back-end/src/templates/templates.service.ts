import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../common/enums';
import { NotificationTemplate } from './entities/notification-template.entity';

export interface RenderedTemplate {
  templateId: string | null;
  subject: string | null;
  body: string;
}

/** Loads templates and renders `{{variable}}` placeholders. */
@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly repo: Repository<NotificationTemplate>,
  ) {}

  findAll(): Promise<NotificationTemplate[]> {
    return this.repo.find();
  }

  /** Replace `{{key}}` tokens with values; missing keys render as empty string. */
  interpolate(template: string, vars: Record<string, unknown> = {}): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
      const value = vars[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  /**
   * Resolve + render a template for a channel. If no named template exists,
   * fall back to a raw body provided by the caller (supports ad-hoc sends).
   */
  async render(
    name: string | undefined,
    channel: Channel,
    vars: Record<string, unknown> = {},
    fallbackBody?: string,
    fallbackSubject?: string,
  ): Promise<RenderedTemplate> {
    if (!name) {
      if (fallbackBody === undefined) {
        throw new NotFoundException(
          'Either a template name or an explicit body is required',
        );
      }
      return {
        templateId: null,
        subject: fallbackSubject
          ? this.interpolate(fallbackSubject, vars)
          : null,
        body: this.interpolate(fallbackBody, vars),
      };
    }

    const tpl = await this.repo.findOne({ where: { name, channel } });
    if (!tpl) {
      throw new NotFoundException(
        `Template "${name}" not found for channel ${channel}`,
      );
    }
    return {
      templateId: tpl.id,
      subject: tpl.subject ? this.interpolate(tpl.subject, vars) : null,
      body: this.interpolate(tpl.bodyTemplate, vars),
    };
  }
}
