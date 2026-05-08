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
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  // Used for timing attack security
  private static readonly TIMING_SAFE_DUMMY_HASH =
    '$2a$10$.ELlUrrqrb93WJJwkLbZc.HDcKCKhabDJLRwIwayfI1R6Au3vnzKq';

  async register(
    userValues: RegisterDto,
    userAgent: string | null,
    ipAddress: string | null,
  ) {
    const foundUser = await this.userService.findOneByEmail(userValues.email);

    // TODO: Refactor after email validation - change type of error
    if (foundUser) {
      throw new BadRequestException('Erro, try again.');
    }

    const hashedPassword = await bcrypt.hash(userValues.password, 10);

    const newUser = await this.userService.create({
      name: userValues.name,
      email: userValues.email,
      password_hash: hashedPassword,
    });

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      role: newUser.role,
    });

    const { token: refreshToken } =
      await this.refreshTokenService.createRefreshToken(
        newUser.id,
        userAgent,
        ipAddress,
      );

    return { user: newUser, accessToken, refreshToken };
  }

  async login(
    userValues: LoginDto,
    userAgent: string | null,
    ipAddress: string | null,
  ) {
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
      foundUser.password_hash,
    );

    if (!isCorrectPassword) {
      throw new UnauthorizedException(
        'Email or Password is incorrect. Try again',
      );
    }

    const accessToken = this.jwtService.sign({
      sub: foundUser.id,
      role: foundUser.role,
    });

    const { token: refreshToken } =
      await this.refreshTokenService.createRefreshToken(
        foundUser.id,
        userAgent,
        ipAddress,
      );

    const { password_hash: _password_hash, ...user } = foundUser;

    return { user, accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<string> {
    const { userId, role } =
      await this.refreshTokenService.validateAndUse(refreshToken);

    const newAccessToken = this.jwtService.sign({
      sub: userId,
      role: role,
    });

    return newAccessToken;
  }
}
