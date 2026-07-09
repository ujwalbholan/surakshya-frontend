import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorage } from '@nestjs/throttler';
import { UserModule } from './feature/user/user.module';
import { AuthModule } from './feature/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './utils/strategies/jwt.strategy';
import { RolesGuard } from './utils/guard/roles.guard';
import { DeviceModule } from './feature/device/device.module';
import { TrackingModule } from './feature/tracking/tracking.module';
import { NotificationModule } from './feature/notification/notification.module';
import { GuardianModule } from './feature/guardian/guardian.module';
import { AdminModule } from './feature/admin/admin.module';
import { PoliceModule } from './feature/police/police.module';
import { PoliceStationsModule } from './feature/police-stations/police-stations.module';
import { PoliceProvisioningModule } from './feature/police-provisioning/police-provisioning.module';
import { MqttModule } from './feature/mqtt/mqtt.module';
import { EmergencyModule } from './feature/emergency/emergency.module';
import { PatrolUnitsModule } from './feature/patrol-units/patrol-units.module';
import { CasesModule } from './feature/cases/cases.module';
import { HealthModule } from './feature/health/health.module';
import { RedisModule } from './config/redis/redis.module';
import { RedisThrottlerStorage } from './config/redis/redis-throttler.service';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: isProduction,
      envFilePath: ['.local.env', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const sslEnabled = configService.get<string>('DB_SSL') === 'true';

        const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.get<string>('DB_HOST'),
                port: Number(configService.get<string>('DB_PORT')),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_NAME'),
              }),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/config/database/migrations/*{.ts,.js}'],
          synchronize:
            nodeEnv === 'development' &&
            configService.get<string>('DB_SYNC') === 'true',
          logging: configService.get<string>('DB_LOGGING') === 'true',
        };
      },
      inject: [ConfigService],
    }),
    HealthModule,
    RedisModule,
    UserModule,
    AuthModule,
    DeviceModule,
    TrackingModule,
    PassportModule,
    NotificationModule,
    AdminModule,
    PoliceModule,
    PoliceStationsModule,
    PoliceProvisioningModule,
    GuardianModule,
    MqttModule,
    EmergencyModule,
    PatrolUnitsModule,
    CasesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    RolesGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: ThrottlerStorage, useClass: RedisThrottlerStorage },
  ],
  exports: [AppService],
})
export class AppModule {}
