import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ScanningPesoService } from './scanning-peso.service';
import { CreateScanningPesoDto } from './dto/create-scanning-peso.dto';
import { ScanningPeso } from './entities/scanning-peso.entity';

@Controller('scanning-peso')
export class ScanningPesoController {
  constructor(private readonly scanningPesoService: ScanningPesoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createScanningPesoDto: CreateScanningPesoDto) {
    const { peso, ...rest } = await this.scanningPesoService.create(createScanningPesoDto);
    return { ...rest, peso_gramos: peso };
  }
}
