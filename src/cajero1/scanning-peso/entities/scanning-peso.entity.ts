import { Column, Entity } from 'typeorm';

@Entity('scanning_peso', { schema: 'cajero1' })
export class ScanningPeso {
  @Column('varchar', { primary: true, name: 'scanning', length: 45 })
  scanning: string;

  @Column('int', { name: 'peso', nullable: true })
  peso: number | null;

  @Column('int', { name: 'control_peso', nullable: true })
  controlPeso: number | null;

  @Column('int', {
    name: 'ToleranciaIndividual',
    nullable: true,
    default: () => "'00000000000'",
  })
  toleranciaIndividual: number | null;
}
