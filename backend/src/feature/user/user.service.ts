import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from 'src/feature/auth/dto/auth.dto';
import { TokenService } from 'src/utils/token/token.service';
import { safeUser } from 'src/utils/safe-user';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly tokenService: TokenService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    const phone = this.normalizePhone(createUserDto.phone);

    const isEmailExist = await this.userRepository.findOne({
      where: [{ email: createUserDto.email }, { phone }],
    });

    if (isEmailExist?.email) {
      throw new BadRequestException('Email already exists');
    } else if (isEmailExist?.phone) {
      throw new BadRequestException('Phone Number already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    const user = this.userRepository.create({
      full_name: createUserDto.full_name,
      email: createUserDto.email,
      password_hash: passwordHash,
      phone,
      role: createUserDto.role,
    });

    return this.userRepository.save(user);
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim().replace(/^\+977/, '');
    const cleaned = trimmed.replace(/[\s-]/g, '');
    return cleaned;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Email');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Password');
    }

    const token = await this.tokenService.generateToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });

    const userData = {
      message: 'Login Successfull',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      sessionId: token.sessionId,
    };

    return userData;
  }

  async findAll(
    excludeUserId?: string,
  ): Promise<Omit<User, 'password_hash'>[]> {
    const users = excludeUserId
      ? await this.userRepository.find({ where: { id: Not(excludeUserId) } })
      : await this.userRepository.find();
    return users.map((user) => safeUser(user));
  }

  async findOne(id: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;
    return safeUser(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<User> | null> {
    const user = new User();

    if (updateUserDto.full_name) user.full_name = updateUserDto.full_name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.phone)
      user.phone = this.normalizePhone(updateUserDto.phone);
    if (updateUserDto.role) user.role = updateUserDto.role;
    if (updateUserDto.password) {
      user.password_hash = await bcrypt.hash(updateUserDto.password, 12);
    }

    await this.userRepository.update(id, user);

    return this.findOne(id);
  }

  async updatePassword(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    await this.userRepository.update(
      { email },
      { password_hash: passwordHash },
    );
  }

  remove(id: string) {
    return this.userRepository.delete({ id });
  }
}
