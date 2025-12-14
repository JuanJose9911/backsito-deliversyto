import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Driver } from './entities/driver.entity';
import { Vehicle } from './entities/vehicle.entity';
import { DriverDocument } from './entities/driver-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, Vehicle, DriverDocument])],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [TypeOrmModule, DriversService],
})
export class DriversModule {}
