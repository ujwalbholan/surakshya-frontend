import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetGuardianEmergencyContactDto {
  @ApiProperty({
    example: true,
    description:
      'When true, this guardian becomes the sole emergency contact for the child. When false, clears the flag if set.',
  })
  @IsBoolean()
  isEmergencyContact!: boolean;
}
