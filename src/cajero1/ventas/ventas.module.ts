import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentaCabecera } from './entities/venta-cabecera.entity';
import { VentaDetalle } from './entities/venta-detalle.entity';
import { PagoTarjeta } from './entities/pago-tarjeta.entity';
import { PagoQr } from './entities/pago-qr.entity';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([VentaCabecera, VentaDetalle, PagoTarjeta, PagoQr]),
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
