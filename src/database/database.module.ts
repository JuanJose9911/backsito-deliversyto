import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { Address } from '../addresses/address.entity';
import { Order } from '../orders/entities/order.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Vehicle } from '../drivers/entities/vehicle.entity';
import { DriverDocument } from '../drivers/entities/driver-document.entity';
import databaseConfig from '../config/database.config';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        entities: [User, Address, Order, Driver, Vehicle, DriverDocument],
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
