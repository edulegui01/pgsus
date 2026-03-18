import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import * as https from 'https';

const OPEN_DOOR_XML = `<RemoteControlDoor xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
    <cmd>open</cmd>
</RemoteControlDoor>`;

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);
  private readonly doorUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.doorUrl = this.configService.get<string>('ACCESS_CONTROL_URL') ?? '';
    this.username = this.configService.get<string>('ACCESS_CONTROL_USER') ?? '';
    this.password = this.configService.get<string>('ACCESS_CONTROL_PASSWORD') ?? '';
  }

  async abrirPuerta(): Promise<string> {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });

    // Primera petición sin auth para obtener el challenge 401
    let wwwAuthenticate: string = '';
    try {
      const firstRes = await firstValueFrom(
        this.httpService.put(this.doorUrl, OPEN_DOOR_XML, {
          httpsAgent,
          headers: { 'Content-Type': 'application/xml' },
          validateStatus: () => true,
        }),
      );
      wwwAuthenticate = firstRes.headers['www-authenticate'] as string ?? '';
      if (firstRes.status !== 401 || !wwwAuthenticate) {
        throw new HttpException(
          `Respuesta inesperada del dispositivo: ${firstRes.status}`,
          firstRes.status,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error en primera petición: ${error.message}`);
      throw new HttpException(
        'No se pudo conectar al control de acceso',
        503,
      );
    }

    // Construir header de Digest Auth
    const authHeader = this.buildDigestAuthHeader(
      wwwAuthenticate,
      'PUT',
      '/ISAPI/AccessControl/RemoteControl/door/1',
    );

    // Segunda petición con el Authorization header
    try {
      const response = await firstValueFrom(
        this.httpService.put(this.doorUrl, OPEN_DOOR_XML, {
          httpsAgent,
          headers: {
            'Content-Type': 'application/xml',
            Authorization: authHeader,
          },
          validateStatus: () => true,
        }),
      );

      this.logger.log(`Respuesta apertura puerta: ${response.status}`);

      if (response.status >= 200 && response.status < 300) {
        return response.data as string;
      }

      throw new HttpException(
        `Error al abrir la puerta: ${response.status} - ${JSON.stringify(response.data)}`,
        response.status,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error en segunda petición: ${error.message}`);
      throw new HttpException(
        'Error al enviar comando de apertura',
        500,
      );
    }
  }

  private buildDigestAuthHeader(
    wwwAuthenticate: string,
    method: string,
    uri: string,
  ): string {
    const realm = this.extractParam(wwwAuthenticate, 'realm');
    const nonce = this.extractParam(wwwAuthenticate, 'nonce');
    const qop = this.extractParam(wwwAuthenticate, 'qop');
    const opaque = this.extractParam(wwwAuthenticate, 'opaque');
    const algorithm = this.extractParam(wwwAuthenticate, 'algorithm') || 'MD5';

    const ha1 = this.md5(`${this.username}:${realm}:${this.password}`);
    const ha2 = this.md5(`${method}:${uri}`);

    let response: string;
    let nc: string | undefined;
    let cnonce: string | undefined;

    if (qop === 'auth' || qop === 'auth-int') {
      nc = '00000001';
      cnonce = crypto.randomBytes(8).toString('hex');
      response = this.md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
    } else {
      response = this.md5(`${ha1}:${nonce}:${ha2}`);
    }

    let header =
      `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", ` +
      `uri="${uri}", algorithm=${algorithm}, response="${response}"`;

    if (qop && nc && cnonce) {
      header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
    }
    if (opaque) {
      header += `, opaque="${opaque}"`;
    }

    return header;
  }

  private extractParam(header: string, param: string): string {
    const match = header.match(new RegExp(`${param}="?([^",]+)"?`));
    return match ? match[1].trim() : '';
  }

  private md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }
}
