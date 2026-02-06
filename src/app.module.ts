import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PegasusModule } from './pegasus/pegasus.module';
import { CajaConfigModule } from './caja-config/caja-config.module';
import { ScanningPesoModule } from './cajero1/scanning-peso/scanning-peso.module';
import { ParametrosModule } from './cajero1/parametros/parametros.module';
import { VentasModule } from './cajero1/ventas/ventas.module';
import { BancardModule } from './bancard/bancard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'assets'),
      serveRoot: '/assets',
      serveStaticOptions: {
        index: false,
      },
    }),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.MariaDB_HOST || 'localhost',
      port: parseInt(process.env.MariaDB_PORT || '3306', 10),
      username: process.env.MariaDB_USER || 'root',
      password: process.env.MariaDB_PASSWORD || '',
      database: process.env.MariaDB_DATABASE || 'cajero1',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),

    // SQL Server (punto de venta existente) - Usando mssql directo via DatabaseService
    PegasusModule,

    // Configuración de caja desde archivo .ini
    CajaConfigModule,

    // Módulos cajero1
    ScanningPesoModule,
    ParametrosModule,
    VentasModule,

    // Bancard
    BancardModule,
  ],
})
export class AppModule {}
