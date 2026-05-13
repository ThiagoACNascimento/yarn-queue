import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { UserWithoutPassword, UserWithPassword } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findOneByEmail(email: string): Promise<UserWithoutPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
      omit: { password_hash: false },
    });
  }
}
