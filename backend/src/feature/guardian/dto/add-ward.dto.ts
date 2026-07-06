import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AddWardDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  child_email!: string;
}
