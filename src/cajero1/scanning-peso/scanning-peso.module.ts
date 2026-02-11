import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScanningPeso } from './entities/scanning-peso.entity';
import { ScanningPesoService } from './scanning-peso.service';
import { ScanningPesoController } from './scanning-peso.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ScanningPeso])],
  controllers: [ScanningPesoController],
  providers: [ScanningPesoService],
  exports: [ScanningPesoService],
})
export class ScanningPesoModule {}
