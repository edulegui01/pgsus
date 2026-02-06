import { BadRequestException } from '@nestjs/common';

export class ProductValidationException extends BadRequestException {
  constructor(field: string, reason: string) {
    const message = `Error de validación en el campo "${field}": ${reason}`;

    super({
      statusCode: 400,
      message,
      error: 'Product Validation Error',
      field,
      reason,
    });
  }
}
