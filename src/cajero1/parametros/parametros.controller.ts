import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ParametrosService } from './parametros.service';
import { Parametro } from './entities/parametro.entity';

@Controller('parametros')
export class ParametrosController {
  constructor(private readonly parametrosService: ParametrosService) {}

  @Get(':clave')
  @HttpCode(HttpStatus.OK)
  async getParametro(@Param('clave') clave: string): Promise<Parametro> {
    const parametro = await this.parametrosService.findByClave(clave);

    if (!parametro) {
      throw new NotFoundException(`Parámetro '${clave}' no encontrado`);
    }

    return parametro;
  }
}
