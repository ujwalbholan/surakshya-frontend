import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LiveEmergencyUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  phone!: string;
}

export class LiveEmergencyLastLocationDto {
  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}

export class LiveEmergencyEventDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  deviceId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiProperty()
  imei!: string;

  @ApiPropertyOptional({ nullable: true })
  label!: string | null;

  @ApiPropertyOptional({ nullable: true })
  eventType!: string | null;

  @ApiProperty({ enum: ['active', 'resolved'] })
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  latitude!: number | null;

  @ApiPropertyOptional({ nullable: true })
  longitude!: number | null;

  @ApiPropertyOptional({ nullable: true })
  altitudeM!: number | null;

  @ApiPropertyOptional({ nullable: true })
  triggerNotes!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  assignedStationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  assignedStationName!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  resolvedAt!: Date | null;

  @ApiPropertyOptional({ type: LiveEmergencyUserDto, nullable: true })
  user!: LiveEmergencyUserDto | null;

  @ApiPropertyOptional({ type: LiveEmergencyLastLocationDto, nullable: true })
  lastLocation!: LiveEmergencyLastLocationDto | null;
}

export class LiveEmergenciesResponseDto {
  @ApiProperty({ type: [LiveEmergencyEventDto] })
  data!: LiveEmergencyEventDto[];

  @ApiProperty()
  total!: number;
}
