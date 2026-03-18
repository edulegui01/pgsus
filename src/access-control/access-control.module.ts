import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
