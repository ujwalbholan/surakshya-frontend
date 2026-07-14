import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ADMIN_SETTING_KEYS,
  ADMIN_SETTINGS_DEFAULTS,
  AdminSettingKey,
} from 'src/constants/admin-settings.constants';
import { AdminSetting } from './entities/admin-setting.entity';
import { UpdateAdminSettingsDto } from './dto/update-admin-settings.dto';

@Injectable()
export class AdminSettingsService {
  constructor(
    @InjectRepository(AdminSetting)
    private readonly settingsRepo: Repository<AdminSetting>,
  ) {}

  async getSettings() {
    const rows = await this.settingsRepo.find();
    const settings: Record<string, unknown> = {
      ...ADMIN_SETTINGS_DEFAULTS,
    };

    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return {
      message: 'Admin settings retrieved successfully',
      settings,
    };
  }

  async updateSettings(dto: UpdateAdminSettingsDto) {
    const updates: Partial<Record<AdminSettingKey, unknown>> = {};

    for (const key of ADMIN_SETTING_KEYS) {
      if (dto[key] !== undefined) {
        updates[key] = dto[key];
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      let row = await this.settingsRepo.findOne({ where: { key } });
      if (!row) {
        row = this.settingsRepo.create({ key, value });
      } else {
        if (key === 'notifications' && typeof value === 'object' && value) {
          const current =
            typeof row.value === 'object' && row.value
              ? (row.value as Record<string, unknown>)
              : {};
          row.value = {
            ...current,
            ...(value as Record<string, unknown>),
          };
        } else {
          row.value = value;
        }
      }
      await this.settingsRepo.save(row);
    }

    return this.getSettings();
  }
}
