import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { VentasAutService } from '../services/ventas-aut.service';
import { VentasAut } from '../entities/ventas-aut.entity';
import { PagoRequestDto, PagoResponseDto } from '../dto/pago.dto';
import {
  InsertarProductosRequestDto,
  InsertarProductosResponseDto,
} from '../dto/insertar-productos.dto';

@Controller('pos/ventas-aut')
export class VentasAutController {
  private readonly logger = new Logger(VentasAutService.name);
  constructor(private readonly ventasAutService: VentasAutService) {}

  @Get('codigo-barra/:codigoBarra')
  @HttpCode(HttpStatus.OK)
  async findLastByCodigoBarra(
    @Param('codigoBarra') codigoBarra: string,
  ): Promise<VentasAut | null> {
    return this.ventasAutService.findLastByCodigoBarra(codigoBarra);
  }

  @Post('pago-tarjeta')
  @HttpCode(HttpStatus.OK)
  pagoConTarjeta(@Body() data: PagoRequestDto): Promise<PagoResponseDto> {
    this.logger.log(`pago-tarjeta body: ${JSON.stringify(data, null, 2)}`);
    if (
      data.caja === undefined ||
      data.facturaNro === undefined ||
      data.monto === undefined ||
      !data.detalles?.length
    ) {
      throw new BadRequestException(
        'caja, facturaNro, monto y detalles son requeridos',
      );
    }

    return this.ventasAutService.pagoConTarjeta(data);
  }

  @Post('pago-qr')
  @HttpCode(HttpStatus.OK)
  async pagoConQr(@Body() data: PagoRequestDto): Promise<PagoResponseDto> {
    if (
      data.caja === undefined ||
      data.facturaNro === undefined ||
      data.monto === undefined ||
      !data.detalles?.length
    ) {
      throw new BadRequestException(
        'caja, facturaNro, monto y detalles son requeridos',
      );
    }

    return this.ventasAutService.pagoConQr(data);
  }

  @Post('ticket-clean')
  @HttpCode(HttpStatus.OK)
  async ticketClean(
    @Body() body: { caja: number },
  ): Promise<VentasAut | null | undefined> {
    try {
      const { caja } = body;
      return await this.ventasAutService.CancelInvoice(caja);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('find-client-details')
  @HttpCode(HttpStatus.OK)
  async findClientDetails(
    @Body() body: { caja: number; operacion: number; documento: string },
  ): Promise<VentasAut | null> {
    const { caja, operacion, documento } = body;

    if (caja === undefined || operacion === undefined || !documento) {
      throw new BadRequestException(
        'caja, operacion and documento are required',
      );
    }

    try {
      return this.ventasAutService.findClientDetails(
        caja,
        operacion,
        documento,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('create-invoice')
  @HttpCode(HttpStatus.OK)
  async createInvoice(
    @Body() body: { caja: number; operacion: number; documento: string },
  ): Promise<VentasAut> {
    const { caja, operacion, documento } = body;

    if (caja === undefined || operacion === undefined || !documento) {
      throw new BadRequestException(
        'caja, operacion and documento are required',
      );
    }

    return this.ventasAutService.createInvoice(caja, operacion, documento);
  }

  @Post('register-client')
  @HttpCode(HttpStatus.OK)
  async registerClient(
    @Body()
    body: {
      caja: number;
      operacion: number;
      documento: string;
      nombre: string;
    },
  ): Promise<VentasAut> {
    const { caja, operacion, documento, nombre } = body;

    if (
      caja === undefined ||
      operacion === undefined ||
      !documento ||
      !nombre
    ) {
      throw new BadRequestException(
        'caja, operacion, documento and nombre are required',
      );
    }

    return this.ventasAutService.registerClient(
      caja,
      operacion,
      documento,
      nombre,
    );
  }

  @Post('solicitud-cobro-tarjeta')
  @HttpCode(HttpStatus.OK)
  async solicitudCobroTarjeta(
    @Body()
    body: {
      caja: number;
      operacion: number;
      tipoCobro: number;
      bin: string;
    },
  ): Promise<VentasAut> {
    const { caja, operacion, tipoCobro, bin } = body;

    if (
      caja === undefined ||
      operacion === undefined ||
      tipoCobro === undefined ||
      !bin
    ) {
      throw new BadRequestException(
        'caja, operacion, tipoCobro y bin son requeridos',
      );
    }

    return this.ventasAutService.solicitudCobroTarjeta(
      caja,
      operacion,
      tipoCobro,
      bin,
    );
  }

  @Post('solicitud-cobro-qr')
  @HttpCode(HttpStatus.OK)
  async solicitudCobroQr(
    @Body()
    body: {
      caja: number;
      operacion: number;
      tipoCobro: number;
    },
  ): Promise<VentasAut> {
    const { caja, operacion, tipoCobro } = body;

    if (
      caja === undefined ||
      operacion === undefined ||
      tipoCobro === undefined
    ) {
      throw new BadRequestException(
        'caja, operacion y tipoCobro son requeridos',
      );
    }

    return this.ventasAutService.solicitudCobroQr(caja, operacion, tipoCobro);
  }

  @Post('insertar-productos')
  @HttpCode(HttpStatus.OK)
  async insertarProductos(
    @Body() body: InsertarProductosRequestDto,
  ): Promise<InsertarProductosResponseDto> {
    const { caja, productos } = body;

    if (caja === undefined || !productos?.length) {
      throw new BadRequestException('caja y productos son requeridos');
    }

    return this.ventasAutService.insertarProductos(caja, productos);
  }
}
