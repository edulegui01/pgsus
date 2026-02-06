export class CrearPagoTarjetaDto {
  ventaCabeceraId: number;
  caja: number;
  monto: number;
  bin?: string;
  nsu?: string;
  pan?: string;
  codigoAutorizacion: string;
  nroBoleta: string;
  codigoComercio?: string;
  nombreTarjeta?: string;
  nombreCliente?: string;
  issuerId?: string;
  mensajeDisplay?: string;
  montoVuelto?: number;
  saldo?: number;
  json?: string;
}

export class CrearPagoQrDto {
  ventaCabeceraId: number;
  caja: number;
  monto: number;
  codigoAutorizacion: string;
  nroBoleta: string;
  codigoComercio?: string;
  nombreTarjeta?: string;
  nombreCliente?: string;
  issuerId?: string;
  mensajeDisplay?: string;
  montoVuelto?: number;
  saldo?: number;
  json?: string;
}
