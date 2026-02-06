import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pago_tarjeta', { schema: 'cajero1' })
export class PagoTarjeta {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column('int', { name: 'venta_cabecera_id', nullable: true })
  ventaCabeceraId: number | null;

  @Column('int', { nullable: true })
  caja: number | null;

  @Column('decimal', { precision: 12, scale: 3, nullable: true })
  monto: number | null;

  @Column('varchar', { length: 20, nullable: true })
  bin: string | null;

  @Column('varchar', { length: 50, nullable: true })
  nsu: string | null;

  @Column('varchar', { length: 30, nullable: true })
  pan: string | null;

  @Column('varchar', { name: 'codigo_autorizacion', length: 200, nullable: true })
  codigoAutorizacion: string | null;

  @Column('varchar', { name: 'nro_boleta', length: 50, nullable: true })
  nroBoleta: string | null;

  @Column('varchar', { name: 'codigo_comercio', length: 50, nullable: true })
  codigoComercio: string | null;

  @Column('varchar', { name: 'nombre_tarjeta', length: 100, nullable: true })
  nombreTarjeta: string | null;

  @Column('varchar', { name: 'nombre_cliente', length: 200, nullable: true })
  nombreCliente: string | null;

  @Column('varchar', { name: 'issuer_id', length: 50, nullable: true })
  issuerId: string | null;

  @Column('varchar', { name: 'mensaje_display', length: 300, nullable: true })
  mensajeDisplay: string | null;

  @Column('decimal', { name: 'monto_vuelto', precision: 12, scale: 3, nullable: true })
  montoVuelto: number | null;

  @Column('decimal', { precision: 12, scale: 3, nullable: true })
  saldo: number | null;

  @Column('longtext', { nullable: true })
  json: string | null;

  @Column('datetime', { name: 'fecha_pago', default: () => 'CURRENT_TIMESTAMP' })
  fechaPago: Date;
}
