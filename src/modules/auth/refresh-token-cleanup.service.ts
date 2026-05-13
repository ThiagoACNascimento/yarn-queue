import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RefreshTokenCleanUpService {
  private readonly logger = new Logger(RefreshTokenCleanUpService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredAndRevokedRefreshTokens(): Promise<void> {
    const enable = this.configService.getOrThrow<boolean>(
      'ENABLE_CLEANUP_JOBS',
    );

    if (!enable) {
      return;
    }

    const retationDays = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_RETENTION_DAYS',
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retationDays);

    const result = await this.prismaService.refreshToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: cutoff } },
          { revoked_at: { lt: cutoff, not: null } },
        ],
      },
    });

    this.logger.log(
      `Cleaned up ${result.count} expired/revoked refresh tokens`,
    );
  }
}
