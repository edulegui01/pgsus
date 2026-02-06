import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parametro } from './entities/parametro.entity';
import { ParametrosService } from './parametros.service';
import { ParametrosController } from './parametros.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Parametro])],
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class ParametrosModule {}
