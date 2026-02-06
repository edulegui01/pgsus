import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CrearVentaDto } from './dto/crear-venta.dto';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crearVenta(@Body() data: CrearVentaDto) {
    if (!data.idCaja || !data.totalPrecio || !data.detalles?.length) {
      throw new BadRequestException(
        'idCaja, totalPrecio y detalles son requeridos',
      );
    }

    return this.ventasService.crearVenta(data);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getVenta(@Param('id') id: number) {
    const venta = await this.ventasService.findVentaCompleta(id);

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return venta;
  }
}
