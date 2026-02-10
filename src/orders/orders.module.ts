import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { 
  Order, 
  OrderRating, 
  OrderDriverRejection, 
  OrderStatusHistory, 
  Payment 
} from './entities';
import { Driver } from '../drivers/entities/driver.entity';
import { User } from '../users/user.entity';
import { PricingService } from './services/pricing.service';
import { DistanceService } from './services/distance.service';
import { OrderAssignmentService } from './services/order-assignment.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, 
      OrderRating, 
      OrderDriverRejection, 
      OrderStatusHistory, 
      Payment,
      Driver,
      User, // Para notificar al usuario
    ]),
    NotificationsModule, // Importar para usar NotificationsService
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PricingService, DistanceService, OrderAssignmentService],
  exports: [TypeOrmModule, OrdersService, DistanceService, OrderAssignmentService],
})
export class OrdersModule {}
