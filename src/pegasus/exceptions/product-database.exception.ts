import { InternalServerErrorException } from '@nestjs/common';

export class ProductDatabaseException extends InternalServerErrorException {
  constructor(operation: string, details?: string) {
    const message = `Error de base de datos al ${operation} producto${details ? `: ${details}` : ''}`;

    super({
      statusCode: 500,
      message,
      error: 'Product Database Error',
      operation,
      details,
    });
  }
}
