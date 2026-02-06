import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('parametros', { schema: 'cajero1' })
export class Parametro {
  @PrimaryColumn('varchar', { name: 'clave', length: 100 })
  clave: string;

  @Column('text', { name: 'valor', nullable: true })
  valor: string | null;
}
