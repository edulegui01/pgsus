import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as ini from 'ini';

@Injectable()
export class CajaConfigService {
  private readonly logger = new Logger(CajaConfigService.name);

  constructor(private configService: ConfigService) {}

  getCaja(): number | null {
    const iniFilePath = this.configService.get<string>('INI_FILE_PATH_CAJA');

    if (!iniFilePath) {
      this.logger.error(
        'INI_FILE_PATH no está configurado en las variables de entorno',
      );
      return null;
    }

    try {
      if (!fs.existsSync(iniFilePath)) {
        this.logger.error(
          `El archivo .ini no existe en la ruta: ${iniFilePath}`,
        );
        return null;
      }

      const fileContent = fs.readFileSync(iniFilePath, 'utf-8');
      const config = ini.parse(fileContent);

      // Buscar en la sección [CAJA]
      if (
        config.CAJA &&
        typeof config.CAJA === 'object' &&
        config.CAJA.CAJA !== undefined
      ) {
        const value = String(config.CAJA.CAJA).replace(/"/g, '');
        return parseInt(value, 10);
      }

      // Buscar en otras secciones
      for (const section of Object.keys(config)) {
        if (
          typeof config[section] === 'object' &&
          config[section].CAJA !== undefined
        ) {
          return parseInt(String(config[section].CAJA), 10);
        }
      }

      this.logger.warn('No se encontró la variable "CAJA" en el archivo .ini');
      return null;
    } catch (error) {
      this.logger.error(`Error al leer el archivo .ini: ${error.message}`);
      return null;
    }
  }
}
