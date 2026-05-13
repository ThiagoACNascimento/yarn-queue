import { Inject, Injectable } from '@nestjs/common';
import { Hasher } from './hasher';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt';
import { BCRYPT_COST_TOKEN } from './cryptography.tokens';

@Injectable()
export class BcryptHasher extends Hasher {
  constructor(@Inject(BCRYPT_COST_TOKEN) private readonly cost: number) {
    super();
  }

  hash(plain: string): Promise<string> {
    return bcryptHash(plain, this.cost);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcryptCompare(plain, hashed);
  }
}
