import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import { ProductsRepository } from '../repositories/products.repository';
import { Product } from '../entities/producto.entity';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { ScanningPesoService } from '../../cajero1/scanning-peso/scanning-peso.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly scanningPesoService: ScanningPesoService,
  ) {}

  async findProductByCode(codigo: string): Promise<Product> {
    try {
      this.logger.log(`Buscando producto con código: ${codigo}`);

      const producto = await this.productsRepository.findProductByCode(codigo);

      if (!producto) {
        throw new ProductNotFoundException(codigo, 'codigo');
      }

      return producto;
    } catch (error) {
      this.logger.error(`Error en findProductByCode: ${error.message}`);
      throw error;
    }
  }

  async findProductByScan(scan: string): Promise<Product> {
    try {
      this.logger.log(`Buscando producto con scan: ${scan}`);

      const producto = await this.productsRepository.findProductByScan(scan);

      if (!producto) {
        throw new ProductNotFoundException(scan, 'scan');
      }

      producto.foto = this.getProductImageUrl(producto.codigo_barra || '');

      // Buscar peso del producto
      const scanningPeso = await this.scanningPesoService.findByScanning(
        producto.codigo,
      );
      producto.peso_gramos = scanningPeso?.peso?.toString() ?? '';

      return producto;
    } catch (error) {
      this.logger.error(`Error en findProductByScan: ${error.message}`);
      throw error;
    }
  }

  private getProductImageUrl(codigoBarras: string): string {
    const extensions = ['.jpg', '.png', '.jpeg', '.webp'];
    const assetsPath = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'assets',
      'products',
    );

    for (const ext of extensions) {
      const imagePath = join(assetsPath, `${codigoBarras}${ext}`);
      if (existsSync(imagePath)) {
        return `/assets/products/${codigoBarras}${ext}`;
      }
    }

    return '';
  }
}
