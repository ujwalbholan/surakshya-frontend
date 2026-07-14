import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  ROLE_MATRIX_PERMISSIONS,
  ROLE_MATRIX_ROLES,
} from 'src/constants/roles-matrix.constants';

export class RolePermissionEntryDto {
  @ApiProperty({ enum: ROLE_MATRIX_ROLES })
  @IsString()
  @IsIn([...ROLE_MATRIX_ROLES])
  role!: string;

  @ApiProperty({ enum: ROLE_MATRIX_PERMISSIONS })
  @IsString()
  @IsNotEmpty()
  permission!: string;

  @ApiProperty()
  @IsBoolean()
  allowed!: boolean;
}

export class UpdateRoleMatrixDto {
  @ApiProperty({ type: [RolePermissionEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RolePermissionEntryDto)
  entries!: RolePermissionEntryDto[];
}
