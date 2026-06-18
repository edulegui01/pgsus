import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../services/database.service';
import { VentasAut } from '../entities/ventas-aut.entity';

@Injectable()
export class VentasAutRepository {
  private readonly logger = new Logger(VentasAutRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async insertProduct(
    caja: number,
    scan: string,
    operacion: number,
    cantidad: number,
  ): Promise<number> {
    try {
      // Convertir cantidad a string con punto decimal
      const cantidadStr = cantidad.toString().replace(',', '.');

      const sql = `
        INSERT INTO ventas_aut (caja, operacion, codigo_barra, cantidad)
        VALUES (@param0, 1, @param1, CAST(@param2 AS DECIMAL(12,3)));
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        scan,
        cantidadStr,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'No se pudo obtener el ID del registro insertado',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error al insertar producto - caja: ${caja}, scan: ${scan}, cantidad: ${cantidad}`,
        error.message,
      );
      throw error;
    }
  }

  async selectVerifyInsert(id: number): Promise<VentasAut> {
    try {
      const sql = `
        SELECT TOP 1
          id, zeta, caja, ticket, operacion, codigo,
          codigo_barra, cantidad, precio, total_venta, tipo_cobro, cod_condicion,
          bin, cod_tarjeta, nro_boleta, cod_autorizacion, tipo_qr, importe_cobrado,
          estado, obs, documento, nombre_cliente, nro_ecom, cantidad_asignada
        FROM dbo.ventas_aut
        WHERE id = @param0
      `;

      const result = await this.databaseService.query<any>(sql, [id]);

      if (!result || result.length === 0) {
        throw new NotFoundException(
          `Registro de venta con ID ${id} no encontrado`,
        );
      }

      const row = result[0];
      const ventasAut: VentasAut = {
        id: row.id,
        zeta: row.zeta,
        caja: row.caja,
        ticket: row.ticket,
        operacion: row.operacion,
        codigo: row.codigo,
        codigo_barra: row.codigo_barra,
        cantidad: parseFloat(row.cantidad),
        precio: parseFloat(row.precio),
        total_venta: parseFloat(row.total_venta),
        tipo_cobro: row.tipo_cobro,
        cod_condicion: row.cod_condicion,
        bin: row.bin,
        cod_tarjeta: row.cod_tarjeta,
        nro_boleta: row.nro_boleta,
        cod_autorizacion: row.cod_autorizacion,
        tipo_qr: row.tipo_qr,
        importe_cobrado: parseFloat(row.importe_cobrado),
        estado: row.estado,
        obs: row.obs,
        documento: row.documento,
        nombre_cliente: row.nombre_cliente,
        nro_ecom: row.nro_ecom,
        cantidad_asignada: row.cantidad_asignada != null ? parseFloat(row.cantidad_asignada) : undefined,
      };

      return ventasAut;
    } catch (error) {
      this.logger.error(
        `Error al verificar insert con ID ${id}`,
        error.message,
      );
      throw error;
    }
  }

  async registerClient(
    caja: number,
    operacion: number,
    documento: string,
    nombre: string,
  ): Promise<number> {
    try {
      const sql = `
        INSERT INTO ventas_aut (caja, operacion, documento, nombre_cliente)
        VALUES (@param0, @param1, @param2, @param3);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        operacion,
        documento,
        nombre,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'Could not get the inserted record ID',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error registering client - caja: ${caja}, operacion: ${operacion}, documento: ${documento}, nombre: ${nombre}`,
        error.message,
      );
      throw error;
    }
  }

  async cancelInvoice(caja: number, operacion: number): Promise<number> {
    try {
      const sql = `
        INSERT INTO ventas_aut (caja, operacion)
        VALUES (@param0, @param1);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        operacion,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'Could not get the inserted record ID',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error canceling invoice - caja: ${caja}, operacion: ${operacion}`,
        error.message,
      );
      throw error;
    }
  }

  async findPendingTicket(): Promise<number> {
    try {
      // Check if there's a cancel operation with specific error message
      const sqlCheck = `
        SELECT TOP 1 obs
        FROM dbo.ventas_aut
        WHERE estado = 2 AND operacion = 7
        ORDER BY id DESC
      `;

      const resultCheck = await this.databaseService.query<any>(sqlCheck);

      const errorMessage =
        'No se puede anular una venta sin detalles o con total igual a cero.'
          .trim()
          .toLowerCase();

      if (resultCheck && resultCheck.length > 0) {
        const obs = resultCheck[0].obs.toString().trim().toLowerCase();
        if (obs === errorMessage) {
          throw new InternalServerErrorException(
            'Cannot cancel a sale without details or with total equal to zero.',
          );
        }
      }

      // Find the last pending ticket
      const sql = `
        SELECT TOP 1 ticket, operacion
        FROM dbo.ventas_aut
        WHERE estado = 1
        ORDER BY id DESC
      `;

      const result = await this.databaseService.query<any>(sql);

      if (!result || result.length === 0) {
        return 0;
      }

      const row = result[0];
      const operacion = row.operacion;
      const ticket = row.ticket;

      // Return ticket if operacion is 1, 2, 4, 5, 6, or 8
      const validOperaciones = [1, 2, 4, 5, 6, 8];
      if (validOperaciones.includes(operacion)) {
        return ticket;
      }

      return 0;
    } catch (error) {
      this.logger.error('Error finding pending ticket', error.message);
      throw error;
    }
  }

  async consultClient(
    caja: number,
    operation: number,
    documento: string,
  ): Promise<number> {
    try {
      const sql = `
        INSERT INTO ventas_aut (caja, operacion, documento)
        VALUES (@param0, @param1, @param2);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        operation,
        documento,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'Could not get the inserted record ID',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error querying client - caja: ${caja}, operacion: 4, documento: ${documento}`,
        error.message,
      );
      throw error;
    }
  }

  async findById(id: number): Promise<VentasAut | null> {
    try {
      const sql = `
        SELECT TOP 1
          id, zeta, caja, ticket, operacion, codigo,
          codigo_barra, cantidad, precio, total_venta, tipo_cobro, cod_condicion,
          bin, cod_tarjeta, nro_boleta, cod_autorizacion, tipo_qr, importe_cobrado,
          estado, obs, documento, nombre_cliente, cantidad_asignada
        FROM dbo.ventas_aut
        WHERE id = @param0
      `;

      const result = await this.databaseService.query<any>(sql, [id]);

      if (!result || result.length === 0) {
        return null;
      }

      const row = result[0];
      const ventasAut: VentasAut = {
        id: row.id,
        zeta: row.zeta,
        caja: row.caja,
        ticket: row.ticket,
        operacion: row.operacion,
        codigo: row.codigo,
        codigo_barra: row.codigo_barra,
        cantidad: parseFloat(row.cantidad),
        precio: parseFloat(row.precio),
        total_venta: parseFloat(row.total_venta),
        tipo_cobro: row.tipo_cobro,
        cod_condicion: row.cod_condicion,
        bin: row.bin,
        cod_tarjeta: row.cod_tarjeta,
        nro_boleta: row.nro_boleta,
        cod_autorizacion: row.cod_autorizacion,
        tipo_qr: row.tipo_qr,
        importe_cobrado: parseFloat(row.importe_cobrado),
        estado: row.estado,
        obs: row.obs,
        documento: row.documento,
        nombre_cliente: row.nombre_cliente,
        cantidad_asignada: row.cantidad_asignada != null ? parseFloat(row.cantidad_asignada) : undefined,
      };

      return ventasAut;
    } catch (error) {
      this.logger.error(`Error finding record by ID ${id}`, error.message);
      throw error;
    }
  }
  //se usa para anular los detalles del ticket que quedo pendiente
  async createInvoice(
    caja: number,
    operacion: number,
    documento: string,
  ): Promise<number> {
    try {
      const sql = `
        INSERT INTO ventas_aut (caja, operacion, documento)
        VALUES (@param0, @param1, @param2);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        operacion,
        documento,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'Could not get the inserted record ID',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error creating invoice - caja: ${caja}, operacion: ${operacion}, documento: ${documento}`,
        error.message,
      );
      throw error;
    }
  }

  async solicitudCobroTarjeta(
    caja: number,
    operacion: number,
    tipoCobro: number,
    bin: string,
  ): Promise<number> {
    try {
      const sql = `
        INSERT INTO ventas_aut (caja, operacion, tipo_cobro, bin)
        VALUES (@param0, @param1, @param2, @param3);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        operacion,
        tipoCobro,
        bin,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'No se pudo obtener el ID del registro insertado',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error en solicitud cobro tarjeta - caja: ${caja}, operacion: ${operacion}, tipo_cobro: ${tipoCobro}, bin: ${bin}`,
        error.message,
      );
      throw error;
    }
  }

  async solicitudCobroQr(
    caja: number,
    operacion: number,
    tipoCobro: number,
  ): Promise<number> {
    try {
      const sql = `
        INSERT INTO ventas_aut (caja, operacion, tipo_cobro)
        VALUES (@param0, @param1, @param2);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        operacion,
        tipoCobro,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'No se pudo obtener el ID del registro insertado',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error en solicitud cobro QR - caja: ${caja}, operacion: ${operacion}, tipo_cobro: ${tipoCobro}`,
        error.message,
      );
      throw error;
    }
  }

  async confirmacionCobroTarjeta(
    caja: number,
    operacion: number,
    nroBoleta: string,
    codAutorizacion: string,
    importeCobrado: number,
  ): Promise<number> {
    try {
      const sql = `
        INSERT INTO ventas_aut (caja, operacion, nro_boleta, cod_autorizacion, importe_cobrado)
        VALUES (@param0, @param1, @param2, @param3, @param4);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        operacion,
        nroBoleta,
        codAutorizacion,
        importeCobrado,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'No se pudo obtener el ID del registro insertado',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error en confirmación cobro tarjeta - caja: ${caja}, nro_boleta: ${nroBoleta}`,
        error.message,
      );
      throw error;
    }
  }

  async confirmacionCobroQr(
    caja: number,
    operacion: number,
    nroBoleta: string,
    codAutorizacion: string,
    tipoQr: string,
    importeCobrado: number,
  ): Promise<number> {
    try {
      const sql = `
        INSERT INTO ventas_aut (caja, operacion, nro_boleta, cod_autorizacion, tipo_qr, importe_cobrado)
        VALUES (@param0, @param1, @param2, @param3, @param4, @param5);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS id;
      `;

      const result = await this.databaseService.query<{ id: number }>(sql, [
        caja,
        operacion,
        nroBoleta,
        codAutorizacion,
        tipoQr,
        importeCobrado,
      ]);

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'No se pudo obtener el ID del registro insertado',
        );
      }

      return result[0].id;
    } catch (error) {
      this.logger.error(
        `Error en confirmación cobro QR - caja: ${caja}, nro_boleta: ${nroBoleta}`,
        error.message,
      );
      throw error;
    }
  }

  async findDetailsByTicket(ticket: number): Promise<VentasAut[]> {
    try {
      const sql = `
        SELECT
          id, zeta, caja, ticket, operacion, codigo,
          codigo_barra, cantidad, precio, total_venta, tipo_cobro, cod_condicion,
          bin, cod_tarjeta, nro_boleta, cod_autorizacion, tipo_qr, importe_cobrado,
          estado, obs, documento, nombre_cliente, nro_ecom, cantidad_asignada
        FROM dbo.ventas_aut
        WHERE estado = 1 AND ticket = @param0
      `;

      const result = await this.databaseService.query<any>(sql, [ticket]);

      if (!result || result.length === 0) {
        return [];
      }

      const ventasAutList: VentasAut[] = result.map((row) => ({
        id: row.id,
        zeta: row.zeta,
        caja: row.caja,
        ticket: row.ticket,
        operacion: row.operacion,
        codigo: row.codigo,
        codigo_barra: row.codigo_barra,
        cantidad: parseFloat(row.cantidad),
        precio: parseFloat(row.precio),
        total_venta: parseFloat(row.total_venta),
        tipo_cobro: row.tipo_cobro,
        cod_condicion: row.cod_condicion,
        bin: row.bin,
        cod_tarjeta: row.cod_tarjeta,
        nro_boleta: row.nro_boleta,
        cod_autorizacion: row.cod_autorizacion,
        tipo_qr: row.tipo_qr,
        importe_cobrado: parseFloat(row.importe_cobrado),
        estado: row.estado,
        obs: row.obs,
        documento: row.documento,
        nombre_cliente: row.nombre_cliente,
        nro_ecom: row.nro_ecom,
        cantidad_asignada: row.cantidad_asignada != null ? parseFloat(row.cantidad_asignada) : undefined,
      }));

      return ventasAutList;
    } catch (error) {
      this.logger.error(
        `Error finding details by ticket ${ticket}`,
        error.message,
      );
      throw error;
    }
  }
}
