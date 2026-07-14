import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ADMIN_SETTINGS_DEFAULTS } from 'src/constants/admin-settings.constants';
import { AdminSettingsService } from './admin-settings.service';
import { AdminSetting } from './entities/admin-setting.entity';

describe('AdminSettingsService', () => {
  let service: AdminSettingsService;
  let repo: jest.Mocked<Repository<AdminSetting>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSettingsService,
        {
          provide: getRepositoryToken(AdminSetting),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn(async (entity) => entity),
          },
        },
      ],
    }).compile();

    service = module.get(AdminSettingsService);
    repo = module.get(getRepositoryToken(AdminSetting));
    jest.clearAllMocks();
  });

  it('returns defaults when no rows exist', async () => {
    repo.find.mockResolvedValue([]);

    const result = await service.getSettings();

    expect(result.settings.platform_name).toBe(
      ADMIN_SETTINGS_DEFAULTS.platform_name,
    );
    expect(result.settings.notifications).toEqual(
      ADMIN_SETTINGS_DEFAULTS.notifications,
    );
  });

  it('overlays persisted values on defaults', async () => {
    repo.find.mockResolvedValue([
      {
        key: 'platform_name',
        value: 'Surakshya Ops',
        updated_at: new Date(),
      },
    ]);

    const result = await service.getSettings();

    expect(result.settings.platform_name).toBe('Surakshya Ops');
    expect(result.settings.language).toBe('English');
  });

  it('updates settings keys', async () => {
    repo.find.mockResolvedValue([
      {
        key: 'platform_name',
        value: 'Updated',
        updated_at: new Date(),
      },
    ]);
    repo.findOne.mockResolvedValue(null);

    const result = await service.updateSettings({
      platform_name: 'Updated',
    });

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'platform_name',
        value: 'Updated',
      }),
    );
    expect(result.settings.platform_name).toBe('Updated');
  });
});
