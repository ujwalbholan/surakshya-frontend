import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from 'src/feature/cases/entities/case.entity';
import { User } from 'src/feature/user/entities/user.entity';
import { EvidenceAdminController } from './evidence-admin.controller';
import { EvidencePoliceController } from './evidence-police.controller';
import { EvidenceService } from './evidence.service';
import { Evidence } from './entities/evidence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evidence, Case, User])],
  controllers: [EvidenceAdminController, EvidencePoliceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
