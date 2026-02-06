export class ProductoInsertDto {
  cod_barra: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export class ProductoInsertResultDto {
  cod_barra: string;
  id: number;
}

export class InsertarProductosRequestDto {
  caja: number;
  productos: ProductoInsertDto[];
}

export class InsertarProductosResponseDto {
  success: boolean;
  total: number;
  resultados: ProductoInsertResultDto[];
}
