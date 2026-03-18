import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private pool: sql.ConnectionPool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private configService: ConfigService) {}

  private readonly maxRetries = 10;
  private readonly retryDelay = 5000;

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(attempt = 1) {
    try {
      const config: sql.config = {
        server: this.configService.get<string>('SQLSERVER_HOST'),
        port: parseInt(
          this.configService.get<string>('SQLSERVER_PORT') ?? '1433',
          10,
        ),
        user: this.configService.get<string>('SQLSERVER_USER'),
        password: this.configService.get<string>('SQLSERVER_PASSWORD'),
        database: this.configService.get<string>('SQLSERVER_DATABASE'),
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      };

      this.pool = await new sql.ConnectionPool(config).connect();
      this.logger.log('Conexión a SQL Server establecida exitosamente');
    } catch (error) {
      if (attempt < this.maxRetries) {
        this.logger.warn(
          `Error al conectar con SQL Server (intento ${attempt}/${this.maxRetries}). Reintentando en ${this.retryDelay / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.connectWithRetry(attempt + 1);
      }
      this.logger.error(
        `No se pudo conectar a SQL Server después de ${this.maxRetries} intentos:`,
        error,
      );
      throw error;
    }
  }

  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    try {
      const request = this.pool.request();

      if (params) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      this.logger.error('Error ejecutando query:', error);
      throw error;
    }
  }

  async execute(
    procedure: string,
    params?: { name: string; type: any; value: any }[],
  ): Promise<any> {
    try {
      const request = this.pool.request();

      if (params) {
        params.forEach((param) => {
          request.input(param.name, param.type, param.value);
        });
      }

      const result = await request.execute(procedure);
      return result.recordset;
    } catch (error) {
      this.logger.error('Error ejecutando stored procedure:', error);
      throw error;
    }
  }

  getPool(): sql.ConnectionPool {
    return this.pool;
  }

  async closeConnection() {
    try {
      await this.pool.close();
      this.logger.log('Conexión cerrada exitosamente');
    } catch (error) {
      this.logger.error('Error al cerrar la conexión:', error);
      throw error;
    }
  }
}
