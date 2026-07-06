import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({ example: 'guardian@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'autoGenPassword123' })
  @IsString()
  oldPassword!: string;

  @ApiProperty({ example: 'newSecurePassword' })
  @IsString()
  @MinLength(5)
  newPassword!: string;
}
