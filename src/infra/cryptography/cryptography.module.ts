import { Module } from '@nestjs/common';
import { Hasher } from './hasher';
import { BcryptHasher } from './bcrypt-hasher';
import { BCRYPT_COST_TOKEN } from './cryptography.tokens';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    { provide: Hasher, useClass: BcryptHasher },
    {
      provide: BCRYPT_COST_TOKEN,
      useFactory: (config: ConfigService) =>
        config.getOrThrow<number>('BCRYPT_COST'),
      inject: [ConfigService],
    },
  ],
  exports: [Hasher],
})
export class CryptographyModule {}
