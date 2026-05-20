import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { Hasher } from '../../infra/cryptography/hasher';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../generated/prisma/enums';

describe('AuthService', () => {
  let service: AuthService;

  let mockUsersService: jest.Mocked<UsersService>;
  let mockRefreshTokenService: jest.Mocked<RefreshTokenService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockHasher: { hash: jest.Mock; compare: jest.Mock };
  let mockConfig: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn(),
      findOneByEmail: jest.fn(),
      findOneByEmailWithPassword: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    mockRefreshTokenService = {
      createRefreshToken: jest.fn(),
      validateAndUse: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllRefreshTokens: jest.fn(),
      enforceSessionLimit: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenService>;

    mockJwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    mockHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockConfig = {
      getOrThrow: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Hasher, useValue: mockHasher },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should hash password and create user when email is new', async () => {
      // ARANGE
      const input = {
        name: 'thiago',
        email: 'thiago@gmail.com',
        password: 'my_password',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockHasher.hash.mockResolvedValue('hashed-password');

      const fakeCreatedUser = {
        id: 'user-uuid',
        name: 'Alice',
        email: 'alice@example.com',
        password_hash: 'hashed-password',
        active: false,
        role: Role.CUSTOMER,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        expired_delete: null,
      };

      mockUsersService.create.mockResolvedValue(fakeCreatedUser);

      mockJwtService.sign.mockReturnValue('fake-access-token');
      mockRefreshTokenService.createRefreshToken.mockResolvedValue({
        token: 'fake-refresh-token',
        expiresAt: new Date(),
      });
      mockConfig.getOrThrow.mockReturnValue(5);

      // ACT
      const result = await service.register(input, 'user-agent', '127.0.0.1');

      // ASSERT
      expect(mockHasher.hash).toHaveBeenCalledWith('my_password');
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('fake-access-token');
      expect(result.refreshToken).toBe('fake-refresh-token');
    });
  });
});
