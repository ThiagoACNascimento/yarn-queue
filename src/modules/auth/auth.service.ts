import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(userValues: RegisterDto) {
    const foundUser = await this.userService.findOneByEmail(userValues.email);

    if (foundUser) {
      throw new BadRequestException(
        'Email aready exists, try with another email.',
      );
    }

    const hashedPassword = await bcrypt.hash(userValues.password, 1);

    const newUser = await this.userService.create({
      ...userValues,
      password: hashedPassword,
    });

    const token = this.jwtService.sign({ sub: newUser.id, role: newUser.role });

    return { user: newUser, token };
  }

  async login(userValues: LoginDto) {
    const foundUser = await this.userService.findOneByEmail(
      userValues.email,
      true,
    );

    if (!foundUser) {
      const FAKE_HASH =
        '$2a$12$.ELlUrrqrb93WJJwkLbZc.HDcKCKhabDJLRwIwayfI1R6Au3vnzKq';
      await bcrypt.compare(`${userValues.password}`, FAKE_HASH);

      throw new UnauthorizedException(
        'Email or Password is incorrect. Try again',
      );
    }

    const isCorrectPassword = await bcrypt.compare(
      userValues.password,
      foundUser.password,
    );

    if (!isCorrectPassword) {
      throw new UnauthorizedException(
        'Email or Password is incorrect. Try again',
      );
    }

    const token: string = this.jwtService.sign({
      sub: foundUser.id,
      role: foundUser.role,
    });

    const { password: _password, ...user } = foundUser;

    return { user, token };
  }
}
