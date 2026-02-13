import { Controller, Post, Body } from '@nestjs/common';
import { BancardService } from './bancard.service';
import {
  IniciarPagoTarjetaRequestDto,
  IniciarPagoTarjetaResponseDto,
  ConfirmarPagoTarjetaRequestDto,
  PagoQrRequestDto,
  VentaTarjetaResponseDto,
  VentaQrResponseDto,
} from './dto/bancard.dto';

@Controller('bancard')
export class BancardController {
  constructor(private readonly bancardService: BancardService) {}

  @Post('verificar-conexion')
  async verificarConexion(): Promise<{ eco: number }> {
    return this.bancardService.verificarConexion();
  }

  @Post('iniciar-pago-tarjeta')
  async iniciarPagoTarjeta(
    @Body() data: IniciarPagoTarjetaRequestDto,
  ): Promise<IniciarPagoTarjetaResponseDto> {
    return this.bancardService.iniciarPagoTarjeta(data);
  }

  @Post('confirmar-pago-tarjeta')
  async confirmarPagoTarjeta(
    @Body() data: ConfirmarPagoTarjetaRequestDto,
  ): Promise<VentaTarjetaResponseDto> {
    return this.bancardService.confirmarPagoTarjeta(data);
  }

  @Post('pago-qr')
  async pagoQr(@Body() data: PagoQrRequestDto): Promise<VentaQrResponseDto> {
    return this.bancardService.pagoQr(data);
  }
}
