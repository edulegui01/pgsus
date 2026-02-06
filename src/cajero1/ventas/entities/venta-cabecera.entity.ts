import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ventas_cabecera', { schema: 'cajero1' })
export class VentaCabecera {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'id_caja', nullable: true })
  idCaja: number | null;

  @Column('int', { name: 'id_cliente', nullable: true })
  idCliente: number | null;

  @Column('double', { name: 'total_peso', nullable: true })
  totalPeso: number | null;

  @Column('double', { name: 'total_precio', nullable: true })
  totalPrecio: number | null;

  @Column('double', { name: 'total_descuento', nullable: true })
  totalDescuento: number | null;

  @Column('double', { name: 'total_impuesto', nullable: true })
  totalImpuesto: number | null;

  @Column('int', { name: 'numero_factura', nullable: true })
  numeroFactura: number | null;

  @Column('int', { name: 'timbrado', nullable: true })
  timbrado: number | null;

  @Column('int', { name: 'medio_pago', nullable: true })
  medioPago: number | null;

  @Column('datetime', { name: 'fecha_venta', nullable: true })
  fechaVenta: Date | null;

  @Column('datetime', { name: 'fecha_actualizacion', nullable: true })
  fechaActualizacion: Date | null;

  @Column('int', { name: 'estado', nullable: true })
  estado: number | null;

  @Column('text', { name: 'respuesta_pago', nullable: true })
  respuestaPago: string | null;
}
