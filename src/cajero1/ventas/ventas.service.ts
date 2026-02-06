import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VentaCabecera } from './entities/venta-cabecera.entity';
import { VentaDetalle } from './entities/venta-detalle.entity';
import { PagoTarjeta } from './entities/pago-tarjeta.entity';
import { PagoQr } from './entities/pago-qr.entity';
import { CrearVentaDto } from './dto/crear-venta.dto';
import { CrearPagoTarjetaDto, CrearPagoQrDto } from './dto/crear-pago.dto';

@Injectable()
export class VentasService {
  private readonly logger = new Logger(VentasService.name);

  constructor(
    @InjectRepository(VentaCabecera)
    private readonly cabeceraRepository: Repository<VentaCabecera>,
    @InjectRepository(VentaDetalle)
    private readonly detalleRepository: Repository<VentaDetalle>,
    @InjectRepository(PagoTarjeta)
    private readonly pagoTarjetaRepository: Repository<PagoTarjeta>,
    @InjectRepository(PagoQr)
    private readonly pagoQrRepository: Repository<PagoQr>,
  ) {}

  async crearVenta(data: CrearVentaDto): Promise<VentaCabecera> {
    this.logger.log(`Creando venta - caja: ${data.idCaja}, total: ${data.totalPrecio}`);

    // Crear cabecera
    const cabecera = this.cabeceraRepository.create({
      idCaja: data.idCaja,
      idCliente: data.idCliente ?? null,
      totalPeso: data.totalPeso ?? null,
      totalPrecio: data.totalPrecio,
      totalDescuento: data.totalDescuento ?? 0,
      totalImpuesto: data.totalImpuesto ?? 0,
      numeroFactura: data.numeroFactura ?? null,
      timbrado: data.timbrado ?? null,
      medioPago: data.medioPago,
      fechaVenta: new Date(),
      fechaActualizacion: new Date(),
      estado: 1,
      respuestaPago: data.respuestaPago ?? null,
    });

    const cabeceraGuardada = await this.cabeceraRepository.save(cabecera);

    this.logger.log(`Cabecera creada con ID: ${cabeceraGuardada.id}`);

    // Crear detalles
    for (const item of data.detalles) {
      const detalle = this.detalleRepository.create({
        cabeceraId: cabeceraGuardada.id,
        codigoBarras: item.codigoBarras,
        cantidad: item.cantidad,
        totalPrecio: item.totalPrecio,
        totalDescuento: item.totalDescuento ?? 0,
        promocionAplicada: item.promocionAplicada ?? null,
      });

      await this.detalleRepository.save(detalle);
    }

    this.logger.log(`Venta creada exitosamente con ${data.detalles.length} items`);

    return cabeceraGuardada;
  }

  async findById(id: number): Promise<VentaCabecera | null> {
    return this.cabeceraRepository.findOne({ where: { id } });
  }

  async findDetallesByCabeceraId(cabeceraId: number): Promise<VentaDetalle[]> {
    return this.detalleRepository.find({ where: { cabeceraId } });
  }

  async findVentaCompleta(id: number): Promise<{ cabecera: VentaCabecera; detalles: VentaDetalle[] } | null> {
    const cabecera = await this.findById(id);

    if (!cabecera) {
      return null;
    }

    const detalles = await this.findDetallesByCabeceraId(id);

    return { cabecera, detalles };
  }

  async crearPagoTarjeta(data: CrearPagoTarjetaDto): Promise<PagoTarjeta> {
    this.logger.log(
      `Creando pago tarjeta - ventaCabeceraId: ${data.ventaCabeceraId}, monto: ${data.monto}`,
    );

    const pago = this.pagoTarjetaRepository.create({
      ventaCabeceraId: data.ventaCabeceraId,
      caja: data.caja,
      monto: data.monto,
      bin: data.bin ?? null,
      nsu: data.nsu ?? null,
      pan: data.pan ?? null,
      codigoAutorizacion: data.codigoAutorizacion,
      nroBoleta: data.nroBoleta,
      codigoComercio: data.codigoComercio ?? null,
      nombreTarjeta: data.nombreTarjeta ?? null,
      nombreCliente: data.nombreCliente ?? null,
      issuerId: data.issuerId ?? null,
      mensajeDisplay: data.mensajeDisplay ?? null,
      montoVuelto: data.montoVuelto ?? null,
      saldo: data.saldo ?? null,
      json: data.json ?? null,
      fechaPago: new Date(),
    });

    const pagoGuardado = await this.pagoTarjetaRepository.save(pago);

    this.logger.log(`Pago tarjeta creado con ID: ${pagoGuardado.id}`);

    return pagoGuardado;
  }

  async crearPagoQr(data: CrearPagoQrDto): Promise<PagoQr> {
    this.logger.log(
      `Creando pago QR - ventaCabeceraId: ${data.ventaCabeceraId}, monto: ${data.monto}`,
    );

    const pago = this.pagoQrRepository.create({
      ventaCabeceraId: data.ventaCabeceraId,
      caja: data.caja,
      monto: data.monto,
      codigoAutorizacion: data.codigoAutorizacion,
      nroBoleta: data.nroBoleta,
      codigoComercio: data.codigoComercio ?? null,
      nombreTarjeta: data.nombreTarjeta ?? null,
      nombreCliente: data.nombreCliente ?? null,
      issuerId: data.issuerId ?? null,
      mensajeDisplay: data.mensajeDisplay ?? null,
      montoVuelto: data.montoVuelto ?? null,
      saldo: data.saldo ?? null,
      json: data.json ?? null,
      fechaPago: new Date(),
    });

    const pagoGuardado = await this.pagoQrRepository.save(pago);

    this.logger.log(`Pago QR creado con ID: ${pagoGuardado.id}`);

    return pagoGuardado;
  }
}
