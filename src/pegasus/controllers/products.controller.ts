import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { VentasAutService } from '../services/ventas-aut.service';
import { CajaConfigService } from '../../caja-config/caja-config.service';
import { Product } from '../entities/producto.entity';
import { ScanProductDto } from '../dto/scan-product.dto';
import { ModelProducTicket } from '../entities/model-produc-ticket.entity';

@Controller('pos/productos')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly ventasAutService: VentasAutService,
    private readonly cajaConfigService: CajaConfigService,
  ) {}

  @Get('codigo/:codigo')
  @HttpCode(HttpStatus.OK)
  async findByCode(@Param('codigo') codigo: string): Promise<Product> {
    return await this.productsService.findProductByCode(codigo);
  }

  @Get('consulta/:scan')
  @HttpCode(HttpStatus.OK)
  async consultProduct(@Param('scan') scan: string): Promise<Product> {
    return await this.productsService.findProductByScan(scan);
  }

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scanProduct(@Body() dto: ScanProductDto): Promise<ModelProducTicket> {
    const caja = this.cajaConfigService.getCaja();

    if (caja === null) {
      throw new BadRequestException('No se pudo obtener el número de caja');
    }

    return await this.ventasAutService.getProduct(caja, dto.scan, dto.cantidad_a_insertar, dto.cantidad_acumulada);
  }
}
