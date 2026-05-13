import type { User } from '../../generated/prisma/client';

export type UserWithoutPassword = Omit<User, 'password_hash'>;
export type UserWithPassword = User;
