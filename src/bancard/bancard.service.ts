import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  IniciarPagoTarjetaRequestDto,
  IniciarPagoTarjetaResponseDto,
  ConfirmarPagoTarjetaRequestDto,
  PagoQrRequestDto,
  VentaQrResponseDto,
  VentaTarjetaResponseDto,
  BancardErrorDto,
} from './dto/bancard.dto';

@Injectable()
export class BancardService {
  private readonly logger = new Logger(BancardService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const ip = this.configService.get<string>('BANCARD_IP');
    const port = this.configService.get<string>('BANCARD_PORT');
    this.baseUrl = `http://${ip}:${port}`;
  }

  /**
   * Verifica la conexión con el POS
   */
  async verificarConexion(): Promise<{ eco: number }> {
    const url = `${this.baseUrl}/pos/eco`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ eco: number }>(url, { eco: 1 }),
      );

      return response.data;
    } catch (error) {
      const errorResponse: BancardErrorDto = error.response?.data || {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS',
      };

      this.logger.error(
        `Error en verificarConexion: ${JSON.stringify(errorResponse)}`,
      );

      throw new HttpException(errorResponse, error.response?.status || 500);
    }
  }

  /**
   * Primera parte del pago con tarjeta - Inicia la transacción en el POS
   * Devuelve el BIN y NSU necesarios para confirmar el pago
   */
  async iniciarPagoTarjeta(
    data: IniciarPagoTarjetaRequestDto,
  ): Promise<IniciarPagoTarjetaResponseDto> {
    const url = `${this.baseUrl}/pos/venta-ux`;

    try {
      this.logger.log(`Enviando petición venta-ux a Bancard: ${url}`);

      const response = await firstValueFrom(
        this.httpService.post<IniciarPagoTarjetaResponseDto>(url, {
          facturaNro: data.facturaNro,
          monto: data.monto,
        }),
      );

      this.logger.log(
        `Respuesta venta-ux: ok | facturaNro: ${data.facturaNro}`,
      );

      return response.data;
    } catch (error) {
      const errorResponse: BancardErrorDto = error.response?.data || {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS para iniciar pago',
      };

      this.logger.error(
        `Error en iniciarPagoTarjeta: ${JSON.stringify(errorResponse)}`,
      );

      throw new HttpException(errorResponse, error.response?.status || 500);
    }
  }

  /**
   * Segunda parte del pago con tarjeta - Confirma la transacción en el POS
   * Requiere el BIN y NSU obtenidos de iniciarPagoTarjeta
   */
  async confirmarPagoTarjeta(
    data: ConfirmarPagoTarjetaRequestDto,
  ): Promise<VentaTarjetaResponseDto> {
    const url = `${this.baseUrl}/pos/descuento`;

    try {
      this.logger.log(`Enviando petición descuento a Bancard: ${url}`);

      const response = await firstValueFrom(
        this.httpService.post<VentaTarjetaResponseDto>(url, {
          bin: data.bin,
          nsu: data.nsu,
          monto: data.monto,
        }),
      );

      this.logger.log(`Respuesta descuento: ok | nsu: ${data.nsu}`);

      return response.data;
    } catch (error) {
      const errorResponse: BancardErrorDto = error.response?.data || {
        statusCode: 500,
        error: 'Internal Server Error',
        message:
          'No se pudo establecer conexión con el POS para confirmar pago',
      };

      this.logger.error(
        `Error en confirmarPagoTarjeta: ${JSON.stringify(errorResponse)}`,
      );

      throw new HttpException(errorResponse, error.response?.status || 500);
    }
  }

  /**
   * Pago con QR - Realiza la transacción completa de QR en el POS
   */
  async pagoQr(data: PagoQrRequestDto): Promise<VentaQrResponseDto> {
    const url = `${this.baseUrl}/pos/venta-qr`;

    try {
      this.logger.log(`Enviando petición QR a Bancard: ${url}`);

      const response = await firstValueFrom(
        this.httpService.post<VentaQrResponseDto>(url, {
          facturaNro: data.facturaNro,
          monto: data.monto,
        }),
      );

      this.logger.log(`Respuesta QR exitosa | facturaNro: ${data.facturaNro}`);

      return response.data;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const errorResponse: BancardErrorDto = error.response?.data || {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'No se pudo establecer conexión con el POS para pago QR',
      };

      this.logger.error(`Error en pagoQr: ${JSON.stringify(errorResponse)}`);

      throw new HttpException(errorResponse, error.response?.status || 500);
    }
  }
}
