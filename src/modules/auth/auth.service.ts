import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

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

    const userReturn = {
      ...newUser,
      token,
    };

    return userReturn;
  }
}
