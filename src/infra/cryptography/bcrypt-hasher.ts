import { Injectable } from '@nestjs/common';
import { Hasher } from './hasher';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt';

@Injectable()
export class BcryptHasher extends Hasher {
  hash(plain: string): Promise<string> {
    return bcryptHash(plain, 10);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcryptCompare(plain, hashed);
  }
}
