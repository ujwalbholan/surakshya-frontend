import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CaseStatus } from 'src/constants/cases.constants';

export class UpdateCaseStatusDto {
  @ApiProperty({ enum: CaseStatus, example: CaseStatus.INVESTIGATING })
  @IsEnum(CaseStatus)
  status!: CaseStatus;
}

export class CreateCaseNoteDto {
  @ApiProperty({ example: 'Officer dispatched to scene; victim contacted.' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
