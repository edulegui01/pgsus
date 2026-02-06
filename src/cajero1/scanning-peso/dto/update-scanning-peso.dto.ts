import { PartialType } from '@nestjs/mapped-types';
import { CreateScanningPesoDto } from './create-scanning-peso.dto';

export class UpdateScanningPesoDto extends PartialType(CreateScanningPesoDto) {}
