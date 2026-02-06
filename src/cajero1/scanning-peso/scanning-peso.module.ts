import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScanningPeso } from './entities/scanning-peso.entity';
import { ScanningPesoService } from './scanning-peso.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScanningPeso])],
  providers: [ScanningPesoService],
  exports: [ScanningPesoService],
})
export class ScanningPesoModule {}
