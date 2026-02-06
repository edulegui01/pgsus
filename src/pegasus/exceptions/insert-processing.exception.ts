import { InternalServerErrorException } from '@nestjs/common';

export class InsertProcessingException extends InternalServerErrorException {
  constructor(id: number, details?: string) {
    const message = `Error al procesar la inserción ${id}${details ? `: ${details}` : ''}`;

    super({
      statusCode: 500,
      message,
      error: 'Insert Processing Error',
      id,
      details,
    });
  }
}
