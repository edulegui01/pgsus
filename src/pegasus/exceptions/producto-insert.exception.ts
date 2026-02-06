import { BadRequestException } from '@nestjs/common';

export class ProductoInsertException extends BadRequestException {
  public readonly codBarra: string;

  constructor(codBarra: string, message: string) {
    super({
      statusCode: 400,
      cod_barra: codBarra,
      message: message,
      error: 'Producto Insert Error',
    });
    this.codBarra = codBarra;
  }
}
