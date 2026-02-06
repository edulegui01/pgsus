import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../services/database.service';
import { Product } from '../entities/producto.entity';
import { ProductDatabaseException } from '../exceptions/product-database.exception';
import { ProductValidationException } from '../exceptions/product-validation.exception';

@Injectable()
export class ProductsRepository {
  private readonly logger = new Logger(ProductsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findProductByCode(codigo: string): Promise<Product | null> {
    if (!codigo || codigo.trim() === '') {
      throw new ProductValidationException(
        'codigo',
        'El código del producto no puede estar vacío',
      );
    }

    try {
      const sql = `
        SELECT
          codigo,
          descripcion_producto,
          precio,
          codigo_barra_int,
          descripcion_corta,
          nivel3
        FROM productos
        WHERE codigo = @param0
      `;

      const result = await this.databaseService.query<any>(sql, [codigo]);

      if (result && result.length > 0) {
        const row = result[0];
        const producto: Product = {
          codigo: row.codigo,
          descripcion: row.descripcion_producto,
          precio: parseFloat(row.precio),
          codigo_barra: row.codigo_barra_int || '',
          descripcion_corta: row.descripcion_corta,
          nivel3: parseInt(row.nivel3),
        };

        return producto;
      }

      return null;
    } catch (error) {
      if (
        error instanceof ProductValidationException ||
        error instanceof ProductDatabaseException
      ) {
        throw error;
      }

      this.logger.error(
        `Error al buscar producto por código ${codigo}:`,
        error,
      );
      throw new ProductDatabaseException(
        'buscar por código',
        error.message || 'Error desconocido',
      );
    }
  }

  async findProductByScan(scan: string): Promise<Product | null> {
    if (!scan || scan.trim() === '') {
      throw new ProductValidationException(
        'scan',
        'El código de escaneo no puede estar vacío',
      );
    }

    try {
      let sql = '';

      if (scan.length <= 5) {
        sql = `
          SELECT TOP 1
            p.codigo,
            p.descripcion_producto,
            p.precio,
            pc.codigo_alternativo,
            p.descripcion_corta,
            p.nivel3,
            p.pesable
          FROM productos AS p
          LEFT JOIN productos_codigos AS pc ON p.codigo = pc.codigo
          WHERE p.codigo = @param0
        `;
      } else {
        sql = `
          SELECT TOP 1
            p.codigo,
            p.descripcion_producto,
            p.precio,
            pc.codigo_alternativo,
            p.descripcion_corta,
            p.nivel3,
            p.pesable
          FROM productos AS p
          LEFT JOIN productos_codigos AS pc ON p.codigo = pc.codigo
          WHERE (REPLACE(LTRIM(REPLACE(pc.codigo_alternativo, '0', ' ')), ' ', '0') =
                 REPLACE(LTRIM(REPLACE(@param0, '0', ' ')), ' ', '0'))
             OR p.codigo = @param0
        `;
      }

      const result = await this.databaseService.query<any>(sql, [scan]);

      if (!result || result.length === 0) {
        return null;
      }

      const row = result[0];
      const producto: Product = {
        codigo: row.codigo,
        descripcion: row.descripcion_producto,
        precio: parseFloat(row.precio),
        codigo_barra: row.codigo_alternativo || '',
        descripcion_corta: row.descripcion_corta,
        nivel3: parseInt(row.nivel3),
        pesable: row.pesable,
      };

      return producto;
    } catch (error) {
      if (
        error instanceof ProductValidationException ||
        error instanceof ProductDatabaseException
      ) {
        throw error;
      }

      this.logger.error(`Error finding product by scan ${scan}:`, error);
      throw new ProductDatabaseException(
        'buscar por escaneo',
        error.message || 'Error desconocido',
      );
    }
  }
}
