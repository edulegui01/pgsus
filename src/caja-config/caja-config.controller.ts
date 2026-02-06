import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { CajaConfigService } from './caja-config.service';

@Controller('caja-config')
export class CajaConfigController {
  constructor(private readonly cajaConfigService: CajaConfigService) {}

  @Get('caja')
  getCaja(): { caja: number } {
    const caja = this.cajaConfigService.getCaja();

    if (caja === null) {
      throw new HttpException(
        'No se pudo obtener el valor de caja',
        HttpStatus.NOT_FOUND,
      );
    }

    return { caja };
  }
}
