import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './services/database.service';
import { ProductsRepository } from './repositories/products.repository';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { VentasAutRepository } from './repositories/ventas-aut.repository';
import { VentasAutService } from './services/ventas-aut.service';
import { VentasAutController } from './controllers/ventas-aut.controller';
import { ScanningPesoModule } from '../cajero1/scanning-peso/scanning-peso.module';
import { CajaConfigModule } from '../caja-config/caja-config.module';
import { BancardModule } from '../bancard/bancard.module';
import { VentasModule } from '../cajero1/ventas/ventas.module';

@Module({
  imports: [ConfigModule, ScanningPesoModule, CajaConfigModule, BancardModule, VentasModule],
  controllers: [ProductsController, VentasAutController],
  providers: [
    DatabaseService,
    ProductsRepository,
    ProductsService,
    VentasAutRepository,
    VentasAutService,
  ],
  exports: [
    DatabaseService,
    ProductsRepository,
    ProductsService,
    VentasAutRepository,
    VentasAutService,
  ],
})
export class PegasusModule {}
