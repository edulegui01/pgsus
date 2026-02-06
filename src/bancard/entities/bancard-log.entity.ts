import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bancard_log', { schema: 'cajero1' })
export class BancardLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;
  @Column({
    type: 'enum',
    enum: ['INICIAR_TARJETA', 'CONFIRMAR_TARJETA', 'PAGO_QR'],
  })
  tipo_operacion: string;
  @Column({ type: 'longtext', nullable: true })
  request_json: string;
  @Column({ type: 'longtext', nullable: true })
  response_json: string;
  @Column({ type: 'enum', enum: ['SUCCESS', 'ERROR', 'TIMEOUT'] })
  status: string;
  @Column({ type: 'int', nullable: true })
  http_status_code: number;
  @Column({ type: 'int', nullable: true })
  caja: number;
  @Column({ type: 'int', nullable: true })
  ticket: number;
  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  monto: number;
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;
}
