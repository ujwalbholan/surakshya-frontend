import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export enum Role {
  USER = 'USER',
  GUARDIAN = 'GUARDIAN',
  POLICE = 'POLICE',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(4, { message: 'Must be more than 4 characters' })
  @MaxLength(15, { message: 'Must be less then 15 characters' })
  full_name!: string;

  @ApiProperty({ example: '+97798XXXXXXXX' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password!: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  @IsEnum(Role)
  role!: Role;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password!: string;
}

export class TokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;

  @ApiProperty()
  @IsString()
  accessToken!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    required: false,
    description: 'Required for mobile clients that cannot send httpOnly cookies',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

export class VerifyResetOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(5)
  newPassword!: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(5)
  comparePassword!: string;

  @ApiProperty({ example: 'reset-token-here' })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ example: 'newPassword123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword!: string;
}
