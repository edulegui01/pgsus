export class VentaRequestDto {
  facturaNro: number;
  monto: number;
  caja: number;
}

// DTOs para los servicios desacoplados de Bancard
export class IniciarPagoTarjetaRequestDto {
  facturaNro: number;
  monto: number;
}

export class IniciarPagoTarjetaResponseDto {
  bin: string;
  nsu: string;
}

export class ConfirmarPagoTarjetaRequestDto {
  bin: string;
  nsu: string;
  monto: number;
}

export class PagoQrRequestDto {
  facturaNro: number;
  monto: number;
}

export class VentaTarjetaResponseDto {
  codigoAutorizacion: string;
  nroBoleta: string;
  codigoComercio: string;
  nombreTarjeta: string;
  pan: string;
  mensajeDisplay: string;
  saldo: number;
  nombreCliente: string;
  issuerId: string;
  montoVuelto: number;
}

export class VentaQrResponseDto {
  codigoAutorizacion: string;
  codigoComercio: string;
  issuerId: string;
  mensajeDisplay: string;
  montoVuelto: number;
  nombreCliente: string;
  nombreTarjeta: string;
  nroBoleta: string;
  saldo: number;
}

export class BancardErrorDto {
  statusCode: number;
  error: string;
  message: string;
}
