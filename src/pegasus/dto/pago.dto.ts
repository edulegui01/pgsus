export class DetalleVentaDto {
  codigoBarras: string;
  cantidad: number;
  totalPrecio: number;
  totalDescuento?: number;
  promocionAplicada?: string;
}

export class PagoRequestDto {
  caja: number;
  facturaNro: number;
  monto: number;
  idCliente?: number;
  totalPeso?: number;
  totalDescuento?: number;
  totalImpuesto?: number;
  timbrado?: number;
  detalles: DetalleVentaDto[];
}

export class PagoResponseDto {
  codigoAutorizacion: string;
  nroBoleta: string;
  ventaId: number;
}
