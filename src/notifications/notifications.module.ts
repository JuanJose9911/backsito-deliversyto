import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Driver } from '../drivers/entities/driver.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Driver, User]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // Exportar para usar en otros módulos
})
export class NotificationsModule {}
