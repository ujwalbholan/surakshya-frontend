import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { API_KEY_PREFIX_VISIBLE_CHARS } from 'src/constants/api-keys.constants';
import { ApiKey } from './entities/api-key.entity';

function formatApiKey(key: ApiKey) {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    created_by_id: key.created_by_id ?? null,
    created_by: key.created_by
      ? {
          id: key.created_by.id,
          full_name: key.created_by.full_name,
          email: key.created_by.email,
        }
      : null,
    last_used_at: key.last_used_at ?? null,
    revoked_at: key.revoked_at ?? null,
    created_at: key.created_at,
    updated_at: key.updated_at,
  };
}

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  async findAll() {
    const keys = await this.apiKeyRepo.find({
      relations: ['created_by'],
      order: { created_at: 'DESC' },
    });

    return {
      message: 'API keys retrieved successfully',
      api_keys: keys.map(formatApiKey),
      total: keys.length,
    };
  }

  async create(name: string, createdById?: string) {
    const plaintext = `sk_${randomBytes(24).toString('hex')}`;
    const prefix = plaintext.slice(0, API_KEY_PREFIX_VISIBLE_CHARS);
    const keyHash = await bcrypt.hash(plaintext, 12);

    const entity = this.apiKeyRepo.create({
      name: name.trim(),
      prefix,
      key_hash: keyHash,
      created_by_id: createdById ?? null,
    });

    const saved = await this.apiKeyRepo.save(entity);
    const hydrated = await this.apiKeyRepo.findOne({
      where: { id: saved.id },
      relations: ['created_by'],
    });

    return {
      message: 'API key created successfully',
      api_key: formatApiKey(hydrated!),
      /** Full secret — returned only once on create. */
      secret: plaintext,
    };
  }

  async update(id: string, name: string) {
    const key = await this.findOrThrow(id);
    if (key.revoked_at) {
      throw new BadRequestException('Cannot update a revoked API key');
    }

    key.name = name.trim();
    await this.apiKeyRepo.save(key);
    const hydrated = await this.findOrThrow(id);

    return {
      message: 'API key updated successfully',
      api_key: formatApiKey(hydrated),
    };
  }

  async revoke(id: string) {
    const key = await this.findOrThrow(id);
    if (key.revoked_at) {
      throw new BadRequestException('API key is already revoked');
    }

    key.revoked_at = new Date();
    await this.apiKeyRepo.save(key);
    const hydrated = await this.findOrThrow(id);

    return {
      message: 'API key revoked successfully',
      api_key: formatApiKey(hydrated),
    };
  }

  async verify(plaintext: string): Promise<ApiKey | null> {
    const prefix = plaintext.slice(0, API_KEY_PREFIX_VISIBLE_CHARS);
    const candidates = await this.apiKeyRepo.find({
      where: { prefix, revoked_at: IsNull() },
    });

    for (const candidate of candidates) {
      const matches = await bcrypt.compare(plaintext, candidate.key_hash);
      if (matches) {
        candidate.last_used_at = new Date();
        await this.apiKeyRepo.save(candidate);
        return candidate;
      }
    }

    return null;
  }

  private async findOrThrow(id: string): Promise<ApiKey> {
    const key = await this.apiKeyRepo.findOne({
      where: { id },
      relations: ['created_by'],
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return key;
  }
}
