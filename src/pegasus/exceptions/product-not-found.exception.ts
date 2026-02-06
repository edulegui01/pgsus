import { NotFoundException } from '@nestjs/common';

export class ProductNotFoundException extends NotFoundException {
  constructor(identifier: string, searchType: 'codigo' | 'scan' = 'codigo') {
    const message =
      searchType === 'codigo'
        ? `Producto con código "${identifier}" no encontrado en el sistema POS`
        : `Producto con código de escaneo "${identifier}" no encontrado en el sistema POS`;

    super({
      statusCode: 404,
      message,
      error: 'Product Not Found',
      identifier,
      searchType,
    });
  }
}
