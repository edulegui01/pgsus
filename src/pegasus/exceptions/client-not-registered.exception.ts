import { NotFoundException } from '@nestjs/common';

export class ClientNotRegisteredException extends NotFoundException {
  constructor(documento?: string) {
    const message = documento
      ? `El cliente con documento "${documento}" no está registrado en el sistema`
      : 'El cliente no está registrado en el sistema';

    super({
      statusCode: 404,
      message,
      error: 'Client Not Registered',
      documento,
    });
  }
}
