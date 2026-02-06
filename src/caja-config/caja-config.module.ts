import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CajaConfigService } from './caja-config.service';
import { CajaConfigController } from './caja-config.controller';

@Module({
  imports: [ConfigModule],
  controllers: [CajaConfigController],
  providers: [CajaConfigService],
  exports: [CajaConfigService],
})
export class CajaConfigModule {}
