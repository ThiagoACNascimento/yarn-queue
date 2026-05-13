import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { Prisma, Role } from '../../generated/prisma/client';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createRefreshToken(
    userId: string,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const days = this.config.getOrThrow<number>(
      'REFRESH_TOKEN_EXPIRES_IN_DAYS',
    );
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days);

    const data: Prisma.RefreshTokenCreateInput = {
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt,
      token_hash: tokenHash,
      user: {
        connect: { id: userId },
      },
    };

    await this.prisma.refreshToken.create({ data });

    return { token, expiresAt };
  }

  async validateAndUse(token: string): Promise<{ userId: string; role: Role }> {
    const hashedToken = this.hashToken(token);
    const hashedTokenPrefix = hashedToken.substring(0, 8);

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token_hash: hashedToken },
      include: { user: true },
    });

    if (!refreshToken) {
      this.logger.warn('Refresh Token not found', { hashedTokenPrefix });
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.revoked_at !== null) {
      this.logger.warn('Refresh Token already revoked', {
        userId: refreshToken.user_id,
        hashedTokenPrefix,
        revokedAt: refreshToken.revoked_at,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = new Date();
    if (refreshToken.expires_at < now) {
      this.logger.log('Refresh Token expired', {
        userId: refreshToken.user_id,
        hashedTokenPrefix,
        revokedAt: refreshToken.revoked_at,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { last_used_at: now },
    });

    return {
      userId: refreshToken.user.id,
      role: refreshToken.user.role,
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    // no fail if not found
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: hashedToken },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  async enforceSessionLimit(
    userId: string,
    maxSessions: number,
  ): Promise<void> {
    const activeSessions = await this.prisma.refreshToken.findMany({
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'asc' },
      select: { id: true },
    });

    if (activeSessions.length < maxSessions) return;

    const toRevoke = activeSessions
      .slice(0, activeSessions.length - maxSessions + 1)
      .map((t) => t.id);

    await this.prisma.refreshToken.updateMany({
      where: { id: { in: toRevoke } },
      data: { revoked_at: new Date() },
    });
  }

  private generateToken(): string {
    return randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
