import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScanningPeso } from './entities/scanning-peso.entity';
import { CreateScanningPesoDto } from './dto/create-scanning-peso.dto';
import { UpdateScanningPesoDto } from './dto/update-scanning-peso.dto';

@Injectable()
export class ScanningPesoService {
  constructor(
    @InjectRepository(ScanningPeso)
    private readonly scanningPesoRepository: Repository<ScanningPeso>,
  ) {}

  async findByScanning(scanning: string): Promise<ScanningPeso | null> {
    return this.scanningPesoRepository.findOne({ where: { scanning } });
  }
}
