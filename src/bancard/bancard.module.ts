import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BancardService } from './bancard.service';
import { BancardController } from './bancard.controller';
import { BancardLog } from './entities/bancard-log.entity';

@Module({
  imports: [HttpModule, ConfigModule, TypeOrmModule.forFeature([BancardLog])],
  controllers: [BancardController],
  providers: [BancardService],
  exports: [BancardService, TypeOrmModule],
})
export class BancardModule {}
