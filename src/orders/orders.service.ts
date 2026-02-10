import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatusHistory } from './entities';
import { Driver } from '../drivers/entities/driver.entity';
import { User } from '../users/user.entity';
import { CreateOrderDto } from './dto';
import { PricingService } from './services/pricing.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(OrderStatusHistory)
    private statusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private pricingService: PricingService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Helper: Registrar cambio de estado en historial
   */
  private async recordStatusChange(
    orderId: string,
    fromStatus: string,
    toStatus: string,
    changedBy: string,
    changedByType: 'user' | 'driver' | 'system' | 'admin',
    metadata?: any,
  ): Promise<void> {
    const statusHistory = new OrderStatusHistory();
    statusHistory.orderId = orderId;
    statusHistory.fromStatus = fromStatus;
    statusHistory.toStatus = toStatus;
    statusHistory.changedBy = changedBy;
    statusHistory.changedByType = changedByType;
    statusHistory.metadata = metadata;

    await this.statusHistoryRepository.save(statusHistory);
    this.logger.log(`📝 Estado actualizado: ${fromStatus} → ${toStatus} (por ${changedByType})`);
  }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // Calcular precio y distancia
    const pricing = this.pricingService.calculatePrice(
      createOrderDto.originLatitude,
      createOrderDto.originLongitude,
      createOrderDto.destinationLatitude,
      createOrderDto.destinationLongitude,
      createOrderDto.vehicleType,
    );

    // Generar código de verificación (4 dígitos)
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Crear el pedido
    const order = new Order();
    order.user = { id: userId } as any;
    order.originLatitude = createOrderDto.originLatitude;
    order.originLongitude = createOrderDto.originLongitude;
    order.originFormattedAddress = createOrderDto.originAddress;
    order.originInstructions = createOrderDto.originDetails;
    order.destinationLatitude = createOrderDto.destinationLatitude;
    order.destinationLongitude = createOrderDto.destinationLongitude;
    order.destinationFormattedAddress = createOrderDto.destinationAddress;
    order.destinationInstructions = createOrderDto.destinationDetails;
    order.distanceKm = pricing.distance;
    order.estimatedDurationMinutes = pricing.estimatedDuration;
    order.basePrice = pricing.basePrice;
    order.distanceFee = pricing.distanceFee;
    order.serviceFee = pricing.serviceFee;
    order.total = pricing.totalPrice;
    order.status = 'pending';
    order.verificationCode = verificationCode;

    return await this.orderRepository.save(order);
  }

  async findAll(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'status',
        'originFormattedAddress',
        'destinationFormattedAddress',
        'total',
        'distanceKm',
        'estimatedDurationMinutes',
        'createdAt',
      ],
    });
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  /**
   * Driver inicia viaje al origen para recoger el paquete
   */
  async startPickup(orderId: string, driverId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.driverId !== driverId) {
      throw new BadRequestException('Este pedido no está asignado a ti');
    }

    if (order.status !== 'driver_assigned') {
      throw new BadRequestException(`No puedes iniciar pickup desde el estado: ${order.status}`);
    }

    const previousStatus = order.status;
    await this.orderRepository.update(orderId, {
      status: 'picking_up',
    });

    // Registrar en historial
    await this.recordStatusChange(orderId, previousStatus, 'picking_up', driverId, 'driver');

    const updatedOrder= await this.orderRepository.findOne({ where: { id: orderId } });
    if (!updatedOrder) {
      throw new NotFoundException('Error al recuperar el pedido actualizado');
    }
    return updatedOrder;
  }

  /**
   * Driver confirma que recogió el paquete
   */
  async confirmPickup(orderId: string, driverId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.driverId !== driverId) {
      throw new BadRequestException('Este pedido no está asignado a ti');
    }

    if (order.status !== 'picking_up') {
      throw new BadRequestException(`No puedes confirmar pickup desde el estado: ${order.status}`);
    }

    const previousStatus = order.status;
    await this.orderRepository.update(orderId, {
      status: 'picked_up',
    });

    // Registrar en historial
    await this.recordStatusChange(orderId, previousStatus, 'picked_up', driverId, 'driver');

    // Notificar al usuario que el pedido fue recogido
    try {
      const orderWithUser = await this.orderRepository.findOne({ 
        where: { id: orderId },
        relations: ['user'],
      });
      const user = orderWithUser?.user;
      const driver = await this.driverRepository.findOne({ where: { id: driverId } });
      
      if (user?.fcmToken && driver) {
        await this.notificationsService.notifyOrderPickedUp(
          user.fcmToken,
          orderId,
          driver.name,
        );
        this.logger.log(`📲 Notificación de recogida enviada al usuario`);
      }
    } catch (error) {
      this.logger.error(`Error al notificar al usuario:`, error.message);
    }

    const updatedOrder = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!updatedOrder) {
      throw new NotFoundException('Error al recuperar el pedido actualizado');
    }
    return updatedOrder;
  }

  /**
   * Driver inicia viaje al destino con el paquete
   */
  async startDelivery(orderId: string, driverId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.driverId !== driverId) {
      throw new BadRequestException('Este pedido no está asignado a ti');
    }

    if (order.status !== 'picked_up') {
      throw new BadRequestException(`No puedes iniciar delivery desde el estado: ${order.status}`);
    }

    const previousStatus = order.status;
    await this.orderRepository.update(orderId, {
      status: 'in_transit',
    });

    // Registrar en historial
    await this.recordStatusChange(orderId, previousStatus, 'in_transit', driverId, 'driver');

    const updatedOrder = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!updatedOrder) {
      throw new NotFoundException('Error al recuperar el pedido actualizado');
    }
    return updatedOrder;
  }

  /**
   * Driver completa la entrega - LIBERA AL DRIVER
   */
  async completeOrder(orderId: string, driverId: string, verificationCode?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.driverId !== driverId) {
      throw new BadRequestException('Este pedido no está asignado a ti');
    }

    if (!['in_transit', 'picked_up'].includes(order.status)) {
      throw new BadRequestException(`No puedes completar desde el estado: ${order.status}`);
    }

    // Opcional: Validar código de verificación
    if (verificationCode && order.verificationCode !== verificationCode) {
      throw new BadRequestException('Código de verificación incorrecto');
    }

    const previousStatus = order.status;
    
    // Actualizar pedido a entregado
    await this.orderRepository.update(orderId, {
      status: 'delivered',
    });

    // Registrar en historial
    await this.recordStatusChange(orderId, previousStatus, 'delivered', driverId, 'driver', {
      verificationCodeUsed: !!verificationCode,
    });

    // LIBERAR DRIVER y actualizar ganancias
    const driver = await this.driverRepository.findOne({ where: { id: driverId } });
    if (driver) {
      // Calcular ganancia del driver (70% de distanceFee + 100% de tip)
      const driverEarning = (order.distanceFee * 0.7) + (order.tip || 0);
      
      await this.driverRepository.update(driverId, {
        status: 'online',
        totalEarnings: driver.totalEarnings + driverEarning,
      });
      
      // Limpiar currentOrderId por separado
      await this.driverRepository
        .createQueryBuilder()
        .update(Driver)
        .set({ currentOrderId: () => 'NULL' })
        .where('id = :id', { id: driverId })
        .execute();
    }

    // Notificar al usuario que el pedido fue entregado
    try {
      const orderWithUser = await this.orderRepository.findOne({ 
        where: { id: orderId },
        relations: ['user'],
      });
      const user = orderWithUser?.user;
      
      if (user?.fcmToken) {
        await this.notificationsService.notifyOrderDelivered(
          user.fcmToken,
          orderId,
        );
        this.logger.log(`📲 Notificación de entrega enviada al usuario`);
      }
    } catch (error) {
      this.logger.error(`Error al notificar al usuario:`, error.message);
    }

    const updatedOrder = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!updatedOrder) {
      throw new NotFoundException('Error al recuperar el pedido actualizado');
    }
    return updatedOrder;
  }

  /**
   * Cancelar pedido - LIBERA AL DRIVER si estaba asignado
   */
  async cancelOrder(orderId: string, userId: string, reason: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ 
      where: { id: orderId },
      relations: ['user'],
    });
    
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar que el pedido pertenezca al usuario
    if (order.user.id !== userId) {
      throw new BadRequestException('No tienes permiso para cancelar este pedido');
    }

    // No se puede cancelar si ya está entregado
    if (order.status === 'delivered') {
      throw new BadRequestException('No puedes cancelar un pedido ya entregado');
    }

    // No se puede cancelar si ya está cancelado
    if (order.status === 'cancelled') {
      throw new BadRequestException('El pedido ya está cancelado');
    }

    const previousStatus = order.status;

    // Actualizar pedido a cancelado
    await this.orderRepository.update(orderId, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date(),
    });

    // Registrar en historial
    await this.recordStatusChange(orderId, previousStatus, 'cancelled', userId, 'user', {
      reason,
    });

    // LIBERAR DRIVER si estaba asignado
    if (order.driverId) {
      await this.driverRepository.update(order.driverId, {
        status: 'online',
      });
      
      // Limpiar currentOrderId por separado
      await this.driverRepository
        .createQueryBuilder()
        .update(Driver)
        .set({ currentOrderId: () => 'NULL' })
        .where('id = :id', { id: order.driverId })
        .execute();
    }

    const updatedOrder = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!updatedOrder) {
      throw new NotFoundException('Error al recuperar el pedido actualizado');
    }
    return updatedOrder;
  }
}
