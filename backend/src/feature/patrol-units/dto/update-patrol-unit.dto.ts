import { PartialType } from '@nestjs/mapped-types';
import { CreatePatrolUnitDto } from './create-patrol-unit.dto';

export class UpdatePatrolUnitDto extends PartialType(CreatePatrolUnitDto) {}
