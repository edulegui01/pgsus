import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parametro } from './entities/parametro.entity';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectRepository(Parametro)
    private readonly parametroRepository: Repository<Parametro>,
  ) {}

  async findByClave(clave: string): Promise<Parametro | null> {
    return this.parametroRepository.findOne({ where: { clave } });
  }

  async getValor(clave: string): Promise<string | null> {
    const parametro = await this.findByClave(clave);
    return parametro?.valor ?? null;
  }

  async findAll(): Promise<Parametro[]> {
    return this.parametroRepository.find();
  }

  async setValor(clave: string, valor: string): Promise<Parametro> {
    const existing = await this.findByClave(clave);

    if (existing) {
      existing.valor = valor;
      return this.parametroRepository.save(existing);
    }

    const parametro = this.parametroRepository.create({ clave, valor });
    return this.parametroRepository.save(parametro);
  }

  async delete(clave: string): Promise<boolean> {
    const result = await this.parametroRepository.delete({ clave });
    return (result.affected ?? 0) > 0;
  }
}
