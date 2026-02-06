export class CrearVentaDetalleDto {
  codigoBarras: string;
  cantidad: number;
  totalPrecio: number;
  totalDescuento?: number;
  promocionAplicada?: string;
}

export class CrearVentaDto {
  idCaja: number;
  idCliente?: number;
  totalPeso?: number;
  totalPrecio: number;
  totalDescuento?: number;
  totalImpuesto?: number;
  numeroFactura?: number;
  timbrado?: number;
  medioPago: number;
  respuestaPago?: string;
  detalles: CrearVentaDetalleDto[];
}
