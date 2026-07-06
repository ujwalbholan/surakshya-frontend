import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { RedisService } from 'src/config/redis/redis.service';
import { TokenPayloadType, UserTokenType } from 'src/types/TokenRelTypes';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  private refreshKey(userId: string, sessionId: string) {
    return `auth:refresh:${userId}:${sessionId}`;
  }

  async generateToken(user: UserTokenType) {
    const sessionId = randomUUID();
    const accessTokenExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ??
      '15m') as JwtSignOptions['expiresIn'];
    const refreshTokenExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ??
      '7d') as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        full_name: user.full_name,
        sessionId,
        role: user.role,
        type: 'access',
      },
      {
        secret: process.env.JWT_ACCESS_SECRET as string,
        expiresIn: accessTokenExpiresIn,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        full_name: user.full_name,
        sessionId,
        role: user.role,
        type: 'refresh',
      },
      {
        secret: process.env.JWT_REFRESH_SECRET as string,
        expiresIn: refreshTokenExpiresIn,
      },
    );

    await this.redisService.set(
      this.refreshKey(user.id, sessionId),
      refreshToken,
      7 * 24 * 60 * 60,
    );
    return { accessToken, refreshToken, sessionId };
  }

  async verifyRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayloadType>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token is not Valid');
      }

      const key = this.refreshKey(payload.sub, payload.sessionId);
      const storedToken = await this.redisService.get(key);

      if (!storedToken) {
        await this.revokeAllUserSessions(payload.sub);
        throw new UnauthorizedException(
          'Refresh token reused — all sessions revoked',
        );
      }

      if (storedToken !== refreshToken) {
        await this.revokeAllUserSessions(payload.sub);
        throw new UnauthorizedException(
          'Refresh token reused — all sessions revoked',
        );
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Refresh Token');
    }
  }

  private async revokeAllUserSessions(userId: string) {
    const pattern = `auth:refresh:${userId}:*`;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redisService
        .getClient()
        .scan(cursor, 'MATCH', pattern, 'COUNT', '100');
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    } while (cursor !== '0');
  }

  async revokedRefreshToken(userId: string, sessionId: string) {
    return this.redisService.del(this.refreshKey(userId, sessionId));
  }

  async rotateRefreshToken(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    await this.revokedRefreshToken(payload.sub, payload.sessionId);

    return this.generateToken({
      id: payload.sub,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
    });
  }
}
