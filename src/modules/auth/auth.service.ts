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

  // Used for timing attack security
  private static readonly TIMING_SAFE_DUMMY_HASH =
    '$2a$10$.ELlUrrqrb93WJJwkLbZc.HDcKCKhabDJLRwIwayfI1R6Au3vnzKq';

  async register(userValues: RegisterDto) {
    const foundUser = await this.userService.findOneByEmail(userValues.email);

    // TODO: Refactor after email validation
    if (foundUser) {
      throw new BadRequestException('Erro, try again.');
    }

    const hashedPassword = await bcrypt.hash(userValues.password, 10);

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
      await bcrypt.compare(
        userValues.password,
        AuthService.TIMING_SAFE_DUMMY_HASH,
      );

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
