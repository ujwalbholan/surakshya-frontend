import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DispatchEventAction } from 'src/constants/dispatch.constants';
import { DispatchService } from './dispatch.service';
import { DispatchEvent } from './entities/dispatch-event.entity';

describe('DispatchService', () => {
  let service: DispatchService;
  let repo: jest.Mocked<Repository<DispatchEvent>>;

  const eventId = '550e8400-e29b-41d4-a716-446655440010';

  const mockEvent = (
    overrides: Partial<DispatchEvent> = {},
  ): DispatchEvent =>
    ({
      id: eventId,
      action: DispatchEventAction.DISPATCHED,
      unit_id: '550e8400-e29b-41d4-a716-446655440011',
      unit_name: 'Unit 12',
      case_id: '550e8400-e29b-41d4-a716-446655440012',
      case_number: 'CASE-2026-0001',
      officer_id: '550e8400-e29b-41d4-a716-446655440013',
      officer_name: 'SI Prakash Adhikari',
      metadata: null,
      created_at: new Date('2026-07-14T07:28:00.000Z'),
      ...overrides,
    }) as DispatchEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        {
          provide: getRepositoryToken(DispatchEvent),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DispatchService);
    repo = module.get(getRepositoryToken(DispatchEvent));
    jest.clearAllMocks();
  });

  it('records a dispatch event', async () => {
    const input = {
      action: DispatchEventAction.DISPATCHED,
      unit_id: '550e8400-e29b-41d4-a716-446655440011',
      unit_name: 'Unit 12',
      case_number: 'CASE-2026-0001',
    };
    const saved = mockEvent(input);
    repo.save.mockResolvedValue(saved);

    const result = await service.record(input);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: DispatchEventAction.DISPATCHED,
        unit_name: 'Unit 12',
      }),
    );
    expect(result).toEqual(saved);
  });

  it('lists dispatch events newest first', async () => {
    const events = [mockEvent()];
    repo.findAndCount.mockResolvedValue([events, 1]);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { created_at: 'DESC' },
        skip: 0,
        take: 20,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.events[0]).toMatchObject({
      unit: 'Unit 12',
      case: 'CASE-2026-0001',
      officer: 'SI Prakash Adhikari',
      action: DispatchEventAction.DISPATCHED,
    });
  });
});
