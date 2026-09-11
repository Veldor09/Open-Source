import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './database/prisma.module.js';
import { OijModule } from './modules/oij/oij.module.js';
import { PortalDatosModule } from './modules/portal-datos/portal-datos.module.js';
import { SicopModule } from './modules/sicop/sicop.module.js';
import { SourcesModule } from './modules/sources/sources.module.js';
import { TseModule } from './modules/tse/tse.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    SourcesModule,
    OijModule,
    PortalDatosModule,
    TseModule,
    SicopModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
