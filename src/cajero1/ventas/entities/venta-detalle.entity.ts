import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ventas_detalle', { schema: 'cajero1' })
export class VentaDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { name: 'cabecera_id', nullable: true })
  cabeceraId: number | null;

  @Column('longtext', { name: 'codigo_barras', nullable: true })
  codigoBarras: string | null;

  @Column('double', { name: 'cantidad', nullable: true })
  cantidad: number | null;

  @Column('double', { name: 'total_precio', nullable: true })
  totalPrecio: number | null;

  @Column('double', { name: 'total_descuento', nullable: true })
  totalDescuento: number | null;

  @Column('longtext', { name: 'promocion_aplicada', nullable: true })
  promocionAplicada: string | null;
}
