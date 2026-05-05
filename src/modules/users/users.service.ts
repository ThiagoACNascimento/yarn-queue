import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  findOneByEmail(email: string, includePassword: boolean = false) {
    return this.prisma.user.findUnique({
      where: { email },
      omit: { password: !includePassword },
    });
  }
}
