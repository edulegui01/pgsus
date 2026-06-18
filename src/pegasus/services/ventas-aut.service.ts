import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync } from 'fs';
import { join } from 'path';
import { VentasAutRepository } from '../repositories/ventas-aut.repository';
import { VentasAut } from '../entities/ventas-aut.entity';
import { ModelProducTicket } from '../entities/model-produc-ticket.entity';
import { ProductsService } from './products.service';
import { Product } from '../entities/producto.entity';
import { ScanningPesoService } from '../../cajero1/scanning-peso/scanning-peso.service';
import { BancardService } from '../../bancard/bancard.service';
import {
  VentaTarjetaResponseDto,
  VentaQrResponseDto,
} from '../../bancard/dto/bancard.dto';
import { VentasService } from '../../cajero1/ventas/ventas.service';
import { PagoRequestDto, PagoResponseDto } from '../dto/pago.dto';
import { BancardLog } from '../../bancard/entities/bancard-log.entity';
import {
  ProductoInsertDto,
  ProductoInsertResultDto,
  InsertarProductosResponseDto,
} from '../dto/insertar-productos.dto';
import { ProductoInsertException } from '../exceptions/producto-insert.exception';

@Injectable()
export class VentasAutService {
  private readonly logger = new Logger(VentasAutService.name);

  constructor(
    private readonly ventasAutRepository: VentasAutRepository,
    private readonly productsService: ProductsService,
    private readonly scanningPesoService: ScanningPesoService,
    private readonly configService: ConfigService,
    private readonly bancardService: BancardService,
    private readonly ventasService: VentasService,
    @InjectRepository(BancardLog)
    private readonly bancardLogRepository: Repository<BancardLog>,
  ) {}

  /**
   * Orquesta el flujo completo de pago con tarjeta
   * 1. Inicia pago en POS Bancard (obtiene bin, nsu)
   * 2. Registra solicitud de cobro en Pegasus
   * 3. Confirma pago en POS Bancard
   * 4. Registra confirmación de cobro en Pegasus
   * 5. Guarda la venta en cajero1
   */
  async pagoConTarjeta(data: PagoRequestDto): Promise<PagoResponseDto> {
    try {
      this.logger.log(
        `Iniciando pago con tarjeta - caja: ${data.caja}, facturaNro: ${data.facturaNro}, monto: ${data.monto}`,
      );

      // Paso 1: Iniciar pago en POS Bancard
      const iniciarRequest = { facturaNro: data.facturaNro, monto: data.monto };
      let inicioResponse;
      try {
        inicioResponse =
          await this.bancardService.iniciarPagoTarjeta(iniciarRequest);
        const { bin: _bin1, ...inicioResponseLog } = inicioResponse;
        await this.bancardLogRepository.save({
          tipo_operacion: 'INICIAR_TARJETA',
          request_json: JSON.stringify(iniciarRequest),
          response_json: JSON.stringify(inicioResponseLog),
          status: 'SUCCESS',
          http_status_code: 200,
          caja: data.caja,
          ticket: data.facturaNro,
          monto: data.monto,
        });
      } catch (error) {
        await this.bancardLogRepository.save({
          tipo_operacion: 'INICIAR_TARJETA',
          request_json: JSON.stringify(iniciarRequest),
          response_json: JSON.stringify(error.response?.data || error.message),
          status: 'ERROR',
          http_status_code: error.status || 500,
          caja: data.caja,
          ticket: data.facturaNro,
          monto: data.monto,
        });
        throw error;
      }

      // Paso 2: Registrar solicitud de cobro en Pegasus
      await this.solicitudCobroTarjeta(data.caja, 2, 1, inicioResponse.bin);

      // Paso 3: Confirmar pago en POS Bancard
      const confirmarRequest = {
        bin: inicioResponse.bin,
        nsu: inicioResponse.nsu,
        monto: data.monto,
      };
      let confirmacionResponse;
      try {
        confirmacionResponse =
          await this.bancardService.confirmarPagoTarjeta(confirmarRequest);
        const {
          nombreCliente: _nc1,
          pan: _pan,
          ...confirmacionResponseLog
        } = confirmacionResponse;
        const { bin: _bin2, ...confirmarRequestLog } = confirmarRequest;
        await this.bancardLogRepository.save({
          tipo_operacion: 'CONFIRMAR_TARJETA',
          request_json: JSON.stringify(confirmarRequestLog),
          response_json: JSON.stringify(confirmacionResponseLog),
          status: 'SUCCESS',
          http_status_code: 200,
          caja: data.caja,
          ticket: data.facturaNro,
          monto: data.monto,
        });
      } catch (error) {
        await this.bancardLogRepository.save({
          tipo_operacion: 'CONFIRMAR_TARJETA',
          request_json: JSON.stringify(confirmarRequest),
          response_json: JSON.stringify(error.response?.data || error.message),
          status: 'ERROR',
          http_status_code: error.status || 500,
          caja: data.caja,
          ticket: data.facturaNro,
          monto: data.monto,
        });
        throw error;
      }

      // Paso 4: Registrar confirmación de cobro en Pegasus
      await this.confirmacionCobroTarjeta(
        data.caja,
        3,
        confirmacionResponse.nroBoleta,
        confirmacionResponse.codigoAutorizacion,
        data.monto,
      );

      // Paso 5 y 6: Guardar historial en cajero1 (no bloquea el flujo de pago)
      try {
        const venta = await this.ventasService.crearVenta({
          idCaja: data.caja,
          idCliente: data.idCliente,
          totalPeso: data.totalPeso,
          totalPrecio: data.monto,
          totalDescuento: data.totalDescuento ?? 0,
          totalImpuesto: data.totalImpuesto ?? 0,
          numeroFactura: data.facturaNro,
          timbrado: data.timbrado,
          medioPago: 1, // 1 = Tarjeta
          respuestaPago: JSON.stringify(confirmacionResponse),
          detalles: data.detalles,
        });

        await this.ventasService.crearPagoTarjeta({
          ventaCabeceraId: venta.id,
          caja: data.caja,
          monto: data.monto,
          bin: inicioResponse.bin,
          nsu: inicioResponse.nsu,
          pan: confirmacionResponse.pan,
          codigoAutorizacion: confirmacionResponse.codigoAutorizacion,
          nroBoleta: confirmacionResponse.nroBoleta,
          codigoComercio: confirmacionResponse.codigoComercio,
          nombreTarjeta: confirmacionResponse.nombreTarjeta,
          nombreCliente: confirmacionResponse.nombreCliente,
          issuerId: confirmacionResponse.issuerId,
          mensajeDisplay: confirmacionResponse.mensajeDisplay,
          montoVuelto: confirmacionResponse.montoVuelto,
          saldo: confirmacionResponse.saldo,
          json: JSON.stringify(confirmacionResponse),
        });
      } catch (historialError) {
        this.logger.error(
          `Error guardando historial en cajero1 (tarjeta): ${historialError.message}`,
        );
      }

      this.logger.log(
        `Pago con tarjeta completado exitosamente - nroBoleta: ${confirmacionResponse.nroBoleta}`,
      );

      return {
        codigoAutorizacion: confirmacionResponse.codigoAutorizacion,
        nroBoleta: confirmacionResponse.nroBoleta,
        //ventaId: venta.id,
        ventaId: 1,
      };
    } catch (error) {
      this.logger.error(`Error en pagoConTarjeta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Orquesta el flujo completo de pago con QR
   * 1. Registra solicitud de cobro en Pegasus
   * 2. Realiza pago QR en POS Bancard
   * 3. Registra confirmación de cobro en Pegasus
   * 4. Guarda la venta en cajero1
   */
  async pagoConQr(data: PagoRequestDto): Promise<PagoResponseDto> {
    try {
      this.logger.log(
        `Iniciando pago con QR - caja: ${data.caja}, facturaNro: ${data.facturaNro}, monto: ${data.monto}`,
      );

      // Paso 1: Registrar solicitud de cobro en Pegasus antes del request QR
      //await this.solicitudCobroQr(data.caja, 2, 2);

      // Paso 2: Realizar pago QR en POS Bancard
      const qrRequest = { facturaNro: data.facturaNro, monto: data.monto };
      let qrResponse;
      try {
        qrResponse = await this.bancardService.pagoQr(qrRequest);
        const {
          nombreCliente: _nc2,
          pan: _pan2,
          ...qrResponseLog
        } = qrResponse;
        await this.bancardLogRepository.save({
          tipo_operacion: 'PAGO_QR',
          request_json: JSON.stringify(qrRequest),
          response_json: JSON.stringify(qrResponseLog),
          status: 'SUCCESS',
          http_status_code: 200,
          caja: data.caja,
          ticket: data.facturaNro,
          monto: data.monto,
        });
      } catch (error) {
        await this.bancardLogRepository.save({
          tipo_operacion: 'PAGO_QR',
          request_json: JSON.stringify(qrRequest),
          response_json: JSON.stringify(error.response?.data || error.message),
          status: 'ERROR',
          http_status_code: error.status || 500,
          caja: data.caja,
          ticket: data.facturaNro,
          monto: data.monto,
        });
        throw error;
      }

      // Paso 3: Registrar confirmación de cobro en Pegasus
      await this.confirmacionCobroQr(
        data.caja,
        3,
        qrResponse.nroBoleta,
        qrResponse.codigoAutorizacion,
        qrResponse.nombreTarjeta,
        data.monto,
      );

      // Paso 4 y 5: Guardar historial en cajero1 (no bloquea el flujo de pago)
      try {
        const venta = await this.ventasService.crearVenta({
          idCaja: data.caja,
          idCliente: data.idCliente,
          totalPeso: data.totalPeso,
          totalPrecio: data.monto,
          totalDescuento: data.totalDescuento ?? 0,
          totalImpuesto: data.totalImpuesto ?? 0,
          numeroFactura: data.facturaNro,
          timbrado: data.timbrado,
          medioPago: 2, // 2 = QR
          respuestaPago: JSON.stringify(qrResponse),
          detalles: data.detalles,
        });

        await this.ventasService.crearPagoQr({
          ventaCabeceraId: venta.id,
          caja: data.caja,
          monto: data.monto,
          codigoAutorizacion: qrResponse.codigoAutorizacion,
          nroBoleta: qrResponse.nroBoleta,
          codigoComercio: qrResponse.codigoComercio,
          nombreTarjeta: qrResponse.nombreTarjeta,
          nombreCliente: qrResponse.nombreCliente,
          issuerId: qrResponse.issuerId,
          mensajeDisplay: qrResponse.mensajeDisplay,
          montoVuelto: qrResponse.montoVuelto,
          saldo: qrResponse.saldo,
          json: JSON.stringify(qrResponse),
        });
      } catch (historialError) {
        this.logger.error(
          `Error guardando historial en cajero1 (QR): ${historialError.message}`,
        );
      }

      this.logger.log(
        `Pago con QR completado exitosamente - nroBoleta: ${qrResponse.nroBoleta}`,
      );

      return {
        codigoAutorizacion: qrResponse.codigoAutorizacion,
        nroBoleta: qrResponse.nroBoleta,
        //ventaId: venta.id,
        ventaId: 1,
      };
    } catch (error) {
      this.logger.error(`Error en pagoConQr: ${error.message}`);
      throw error;
    }
  }

  async insertProduct(
    caja: number,
    scan: string,
    operacion: number,
    cantidad: number,
  ): Promise<number> {
    try {
      this.logger.log(
        `Inserting product - caja: ${caja}, scan: ${scan}, operacion: ${operacion}, cantidad: ${cantidad}`,
      );

      const idInsertado = await this.ventasAutRepository.insertProduct(
        caja,
        scan,
        operacion,
        cantidad,
      );

      this.logger.log(`Product inserted successfully with ID: ${idInsertado}`);
      return idInsertado;
    } catch (error) {
      this.logger.error(`Error in insertProduct: ${error.message}`);
      throw error;
    }
  }

  async selectVerifyInsert(id: number): Promise<VentasAut> {
    try {
      this.logger.log(`Verifying insert with ID: ${id}`);

      const ventasAut = await this.ventasAutRepository.selectVerifyInsert(id);

      this.logger.log(`Record found successfully with ID: ${id}`);
      return ventasAut;
    } catch (error) {
      this.logger.error(`Error in selectVerifyInsert: ${error.message}`);
      throw error;
    }
  }

  async getProduct(
    caja: number,
    scan: string,
    cantidad_a_insertar: number,
  ): Promise<ModelProducTicket> {
    try {
      this.logger.log(
        `Getting product - caja: ${caja}, scan: ${scan}, cantidad_a_insertar: ${cantidad_a_insertar}`,
      );

      // Insert product
      const idInsertado = await this.insertProduct(caja, scan, 1, cantidad_a_insertar);

      if (idInsertado <= 0) {
        throw new BadRequestException('Could not insert product');
      }

      // Verify insert with polling
      const insert = await this.verifyPegasusInsert(idInsertado);

      this.logger.log(
        `[getProduct] insert - cantidad: ${insert?.cantidad}, precio: ${insert?.precio}, codigo: ${insert?.codigo}, codigo_barra: ${insert?.codigo_barra}, estado: ${insert?.estado}`,
      );

      // Check if finally the state is 1
      if (!insert || insert.estado !== 1) {
        throw new BadRequestException(
          'Product is not ready after multiple attempts',
        );
      }

      // Search product information
      const producto = await this.productsService.findProductByCode(
        insert.codigo,
      );

      // Barcodes starting with '20' and 13 digits are weighable (EAN-13 internal use).
      // Weight in grams is encoded in digits 8-12 of the barcode.
      const esPesable =
        insert.codigo_barra?.length === 13 &&
        insert.codigo_barra.startsWith('20');

      this.logger.log(
        `[getProduct] codigo_barra: "${insert.codigo_barra}" | largo: ${insert.codigo_barra?.length} | startsWith('20'): ${insert.codigo_barra?.startsWith('20')} | esPesable: ${esPesable}`,
      );

      let peso = '';
      if (esPesable) {
        peso = (insert.cantidad_asignada ?? 0).toString();
        this.logger.log(
          `[getProduct] Pesable - cantidad_asignada (kg): "${peso}"`,
        );
      } else {
        const scanningPeso = await this.scanningPesoService.findByScanning(
          insert.codigo,
        );
        peso = scanningPeso?.peso?.toString() ?? '';
        this.logger.log(
          `[getProduct] No pesable - peso desde scanning_peso: "${peso}"`,
        );
      }

      // Build response model
      const modelProducTicket: ModelProducTicket = {
        codigo: insert.codigo,
        codigo_barras: insert.codigo_barra,
        precio: insert.precio,
        total: esPesable
          ? Math.round((insert.cantidad_asignada ?? 0) * insert.precio)
          : insert.precio * (insert.cantidad_asignada ?? 0),
        descripcion: producto.descripcion_corta ?? '',
        peso,
        cantidad: insert.cantidad_asignada ?? 0,
        total_venta: insert.total_venta,
        imagen: this.getProductImageUrl(
          esPesable || insert.codigo_barra?.startsWith('24')
            ? insert.codigo
            : insert.codigo_barra,
        ),
        es_pesable: esPesable,
      };

      this.logger.log(
        `Product retrieved successfully: ${modelProducTicket.descripcion}`,
      );

      return modelProducTicket;
    } catch (error) {
      this.logger.error(`Error in getProduct: ${error.message}`);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getProductImageUrl(codigoBarras: string): string {
    const extensions = ['.jpg', '.png', '.jpeg', '.webp'];
    const assetsPath = join(process.cwd(), 'assets', 'products');

    for (const ext of extensions) {
      const imagePath = join(assetsPath, `${codigoBarras}${ext}`);
      if (existsSync(imagePath)) {
        return `/assets/products/${codigoBarras}${ext}`;
      }
    }

    return '';
  }

  private async verifyPegasusInsert(id: number): Promise<VentasAut> {
    let estado = 0;
    let intentos = 0;
    let ventasAut: VentasAut | null = null;

    while (estado === 0) {
      ventasAut = await this.selectVerifyInsert(id);

      if (ventasAut.estado === 2) {
        throw new BadRequestException(ventasAut.obs || 'Error en la operación');
      }

      if (ventasAut.estado === 1 || intentos === 100) {
        estado = 1;
      }

      await this.delay(50);
      intentos++;
    }

    return ventasAut!;
  }

  private async verifyPegasusProducts(
    id: number,
    codBarra: string,
  ): Promise<VentasAut> {
    let estado = 0;
    let intentos = 0;
    let ventasAut: VentasAut | null = null;

    while (estado === 0) {
      ventasAut = await this.selectVerifyInsert(id);

      if (ventasAut.estado === 2) {
        throw new ProductoInsertException(
          codBarra,
          ventasAut.obs || 'Error en la operación',
        );
      }

      if (ventasAut.estado === 1 || intentos === 100) {
        estado = 1;
      }

      await this.delay(50);
      intentos++;
    }

    return ventasAut!;
  }

  private async verifyPegasusCancelInvoice(id: number): Promise<VentasAut> {
    const knownMessage =
      'No se puede anular una venta sin detalles o con total igual a cero.'
        .trim()
        .toLowerCase();

    for (let intentos = 0; intentos < 100; intentos++) {
      const ventasAut = await this.selectVerifyInsert(id);

      if (ventasAut.estado !== 0) {
        if (
          ventasAut.estado === 2 &&
          ventasAut.obs?.trim().toLowerCase() !== knownMessage
        ) {
          throw new BadRequestException(
            ventasAut.obs || 'Error al cancelar la factura',
          );
        }
        return ventasAut;
      }

      await this.delay(100);
    }

    throw new InternalServerErrorException(
      'Error al cancelar la factura: tiempo de espera agotado',
    );
  }

  async CancelInvoice(caja: number): Promise<VentasAut | null | undefined> {
    try {
      const insertedId = await this.ventasAutRepository.cancelInvoice(caja, 7);

      if (insertedId > 0) {
        const result = await this.verifyPegasusCancelInvoice(insertedId);
        return result;
      }
    } catch (error) {
      this.logger.error(`Error in CancelInvoice: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  //llamar a este servicio cuando se inicie la venta para cliente sin nombre
  async ticketClean(): Promise<void> {
    // Placeholder for future implementation
    try {
      const pendintTickets = await this.ventasAutRepository.findPendingTicket();
      if (pendintTickets > 0) {
        const ticketList = this.tikectCharge(pendintTickets);
        const quatityTickets = (await ticketList).reduce(
          (acc, item) => acc + Number(item.cantidad || 0),
          0,
        );
        if (quatityTickets > 0) {
          const cancel = await this.CancelInvoice(pendintTickets);
          if (!cancel) {
            throw new BadRequestException(
              'Te pedimos disculpas por este inconveniente. Existe una factura pendiente que no se pudo anular',
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error in invoiceWithoutTax: ${error.message}`);
      throw error;
    }
  }

  private async tikectCharge(ticketid: number): Promise<Product[]> {
    const products: Product[] = [];
    try {
      const ticket =
        await this.ventasAutRepository.findDetailsByTicket(ticketid);
      for (const item of ticket) {
        if (item.estado === 1 && item.operacion == 1) {
          const product = await this.productsService.findProductByCode(
            item.codigo_barra,
          );
          product.codigo_barra = item.codigo_barra;
          product.precio = item.precio;
          product.descripcion = product.descripcion_corta ?? '';
          product.cantidad = item.cantidad;

          products.push(product);
        }
      }
    } catch (error) {
      this.logger.error(`Error in tikectCharge: ${error.message}`);
      throw error;
    }

    return products;
  }
  async registerClient(
    caja: number,
    operacion: number,
    documento: string,
    nombre: string,
  ): Promise<VentasAut> {
    try {
      this.logger.log(
        `Registering client - caja: ${caja}, operacion: ${operacion}, documento: ${documento}, nombre: ${nombre}`,
      );

      const id = await this.ventasAutRepository.registerClient(
        caja,
        operacion,
        documento,
        nombre,
      );

      if (id <= 0) {
        throw new BadRequestException('Could not register client');
      }

      await this.delay(1000);

      const result = await this.ventasAutRepository.selectVerifyInsert(id);

      if (!result || result.estado !== 1) {
        throw new BadRequestException(
          'Client registration is not ready after verification',
        );
      }

      this.logger.log(
        `Client registered and verified successfully with ID: ${id}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error in registerClient: ${error.message}`);
      throw error;
    }
  }

  async createInvoice(
    caja: number,
    operacion: number,
    documento: string,
  ): Promise<VentasAut> {
    try {
      this.logger.log(
        `Creating invoice - caja: ${caja}, operacion: ${operacion}, documento: ${documento}`,
      );

      const id = await this.ventasAutRepository.createInvoice(
        caja,
        operacion,
        documento,
      );

      if (id <= 0) {
        throw new BadRequestException('Could not create invoice');
      }

      await this.delay(1000);

      const invoice = await this.ventasAutRepository.selectVerifyInsert(id);

      if (!invoice || invoice.estado !== 1) {
        throw new BadRequestException(
          'Invoice is not ready after verification',
        );
      }

      this.logger.log(
        `Invoice created and verified successfully with ID: ${id}`,
      );
      return invoice;
    } catch (error) {
      this.logger.error(`Error in createInvoice: ${error.message}`);
      throw error;
    }
  }

  async solicitudCobroTarjeta(
    caja: number,
    operacion: number,
    tipoCobro: number,
    bin: string,
  ): Promise<VentasAut> {
    try {
      this.logger.log(
        `Solicitud cobro tarjeta - caja: ${caja}, operacion: ${operacion}, tipo_cobro: ${tipoCobro}, bin: ${bin}`,
      );

      const id = await this.ventasAutRepository.solicitudCobroTarjeta(
        caja,
        operacion,
        tipoCobro,
        bin,
      );

      if (id <= 0) {
        throw new BadRequestException(
          'No se pudo crear la solicitud de cobro con tarjeta',
        );
      }

      const result = await this.verifyPegasusInsert(id);

      this.logger.log(`Solicitud cobro tarjeta verificada con ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error en solicitudCobroTarjeta: ${error.message}`);
      throw error;
    }
  }

  async solicitudCobroQr(
    caja: number,
    operacion: number,
    tipoCobro: number,
  ): Promise<VentasAut> {
    try {
      this.logger.log(
        `Solicitud cobro QR - caja: ${caja}, operacion: ${operacion}, tipo_cobro: ${tipoCobro}`,
      );

      const id = await this.ventasAutRepository.solicitudCobroQr(
        caja,
        operacion,
        tipoCobro,
      );

      if (id <= 0) {
        throw new BadRequestException(
          'No se pudo crear la solicitud de cobro con QR',
        );
      }

      const result = await this.verifyPegasusInsert(id);

      this.logger.log(`Solicitud cobro QR verificada con ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error en solicitudCobroQr: ${error.message}`);
      throw error;
    }
  }

  async confirmacionCobroTarjeta(
    caja: number,
    operacion: number,
    nroBoleta: string,
    codAutorizacion: string,
    importeCobrado: number,
  ): Promise<VentasAut> {
    try {
      this.logger.log(
        `Confirmación cobro tarjeta - caja: ${caja}, nro_boleta: ${nroBoleta}, cod_autorizacion: ${codAutorizacion}`,
      );

      const id = await this.ventasAutRepository.confirmacionCobroTarjeta(
        caja,
        operacion,
        nroBoleta,
        codAutorizacion,
        importeCobrado,
      );

      if (id <= 0) {
        throw new BadRequestException(
          'No se pudo crear la confirmación de cobro con tarjeta',
        );
      }

      const result = await this.verifyPegasusInsert(id);

      this.logger.log(`Confirmación cobro tarjeta verificada con ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error en confirmacionCobroTarjeta: ${error.message}`);
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
  ): Promise<VentasAut> {
    try {
      this.logger.log(
        `Confirmación cobro QR - caja: ${caja}, nro_boleta: ${nroBoleta}, tipo_qr: ${tipoQr}`,
      );

      const id = await this.ventasAutRepository.confirmacionCobroQr(
        caja,
        operacion,
        nroBoleta,
        codAutorizacion,
        tipoQr,
        importeCobrado,
      );

      if (id <= 0) {
        throw new BadRequestException(
          'No se pudo crear la confirmación de cobro con QR',
        );
      }

      const result = await this.verifyPegasusInsert(id);

      this.logger.log(`Confirmación cobro QR verificada con ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error en confirmacionCobroQr: ${error.message}`);
      throw error;
    }
  }

  //se usa para buscar datos del cliente
  async findClientDetails(
    caja: number,
    operation: number,
    document: string,
  ): Promise<VentasAut | null> {
    try {
      const id = await this.ventasAutRepository.consultClient(
        caja,
        operation,
        document,
      );

      if (id <= 0) {
        throw new BadRequestException('Could not consult client');
      }

      await this.delay(1000);

      const result = await this.ventasAutRepository.selectVerifyInsert(id);

      if (!result) {
        throw new BadRequestException(
          'Problemas con la conexion con el SLC pegasus',
        );
      }

      if (result.estado === 3) {
        throw new NotFoundException(
          result.obs || 'Cliente no encontrado en el sistema',
        );
      }

      if (result.estado !== 1) {
        throw new BadRequestException(
          'Problemas con la conexion con el SLC pegasus',
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Error in findClientDetails: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inserta múltiples productos en ventas_aut
   * Paso 1: Inserta TODOS los productos en paralelo
   * Paso 2: Verifica TODOS en paralelo
   */
  async insertarProductos(
    caja: number,
    productos: ProductoInsertDto[],
  ): Promise<InsertarProductosResponseDto> {
    const tiempoInicio = Date.now();

    this.logger.log(
      `[${Date.now() - tiempoInicio}ms] Insertando ${productos.length} productos - caja: ${caja}`,
    );

    // Paso 1: Insertar TODOS los productos en paralelo
    const inserciones = await Promise.all(
      productos.map(async (producto) => {
        const t1 = Date.now();
        const id = await this.insertProduct(
          caja,
          producto.cod_barra,
          1,
          producto.cantidad,
        );
        this.logger.log(
          `[${Date.now() - tiempoInicio}ms] Insertado ${producto.cod_barra} en ${Date.now() - t1}ms`,
        );

        if (id <= 0) {
          throw new BadRequestException('No se pudo insertar el producto');
        }

        return { cod_barra: producto.cod_barra, id };
      }),
    );

    this.logger.log(
      `[${Date.now() - tiempoInicio}ms] Insertados ${inserciones.length}/${productos.length} productos. Verificando...`,
    );

    // Paso 2: Verificar TODOS en paralelo
    const resultados = await Promise.all(
      inserciones.map(async (insercion) => {
        const t1 = Date.now();
        await this.verifyPegasusProducts(insercion.id, insercion.cod_barra);
        this.logger.log(
          `[${Date.now() - tiempoInicio}ms] Verificado ${insercion.cod_barra} en ${Date.now() - t1}ms`,
        );
        return {
          cod_barra: insercion.cod_barra,
          id: insercion.id,
        };
      }),
    );

    this.logger.log(
      `[${Date.now() - tiempoInicio}ms] Inserción completada - ${resultados.length} productos verificados`,
    );

    return {
      success: true,
      total: productos.length,
      resultados,
    };
  }
}
