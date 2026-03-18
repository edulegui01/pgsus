import { Controller, Put, Logger } from '@nestjs/common';
import { AccessControlService } from './access-control.service';

@Controller('access-control')
export class AccessControlController {
  private readonly logger = new Logger(AccessControlController.name);

  constructor(private readonly accessControlService: AccessControlService) {}

  @Put('door/open')
  async abrirPuerta(): Promise<{ mensaje: string; respuesta?: string }> {
    this.logger.log('Solicitud de apertura de puerta recibida');
    const respuesta = await this.accessControlService.abrirPuerta();
    return { mensaje: 'Puerta abierta correctamente', respuesta };
  }
}
