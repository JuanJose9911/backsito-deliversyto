import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Order, OrderDriverRejection, OrderStatusHistory } from '../entities';
import { Driver } from '../../drivers/entities/driver.entity';
import { User } from '../../users/user.entity';
import { DistanceService } from './distance.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class OrderAssignmentService {
  private readonly logger = new Logger(OrderAssignmentService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(OrderDriverRejection)
    private rejectionRepository: Repository<OrderDriverRejection>,
    @InjectRepository(OrderStatusHistory)
    private statusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private distanceService: DistanceService,
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
  }

  /**
   * Buscar drivers disponibles cerca del origen del pedido
   * @param orderId - ID del pedido
   * @param radiusKm - Radio de búsqueda en kilómetros (default: 5km)
   * @param limit - Número máximo de drivers a notificar (default: 5)
   */
  async findAvailableDrivers(
    orderId: string,
    radiusKm = 5,
    limit = 5,
  ): Promise<Array<Driver & { distance: number }>> {
    // Buscar el pedido
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BadRequestException('Pedido no encontrado');
    }

    // Buscar drivers disponibles (online, sin pedido actual)
    const availableDrivers = await this.driverRepository.find({
      where: {
        status: 'online',
        isAvailable: true,
        isActive: true,
        verificationStatus: 'approved',
        currentOrderId: IsNull(), // Sin pedido actual
      },
    });

    this.logger.log(
      `🔍 Encontrados ${availableDrivers.length} drivers disponibles`,
    );

    // Obtener drivers que han rechazado este pedido
    const rejections = await this.rejectionRepository.find({
      where: { orderId },
      select: ['driverId'],
    });
    const rejectedDriverIds = rejections.map(r => r.driverId);

    // Filtrar drivers que no han rechazado este pedido
    const eligibleDrivers = availableDrivers.filter(
      (driver) => !rejectedDriverIds.includes(driver.id),
    );

    // Filtrar drivers sin ubicación GPS
    const driversWithLocation = eligibleDrivers.filter(
      (driver) =>
        driver.currentLatitude !== null && driver.currentLongitude !== null,
    );

    if (driversWithLocation.length === 0) {
      this.logger.warn('⚠️ No hay drivers disponibles con ubicación GPS');
      return [];
    }

    // Calcular distancias y filtrar por radio
    const nearbyDrivers = this.distanceService.findNearby(
      {
        latitude: order.originLatitude,
        longitude: order.originLongitude,
      },
      driversWithLocation.map((d) => ({
        ...d,
        latitude: d.currentLatitude,
        longitude: d.currentLongitude,
      })),
      radiusKm,
    );

    // Limitar a los N más cercanos
    const topDrivers = nearbyDrivers.slice(0, limit);

    this.logger.log(
      `✅ ${topDrivers.length} drivers dentro de ${radiusKm}km del origen`,
    );

    return topDrivers;
  }

  /**
   * Asignar pedido a múltiples drivers (notificación simultánea)
   * @param orderId - ID del pedido
   * @param timeoutSeconds - Tiempo de espera para aceptación (default: 120)
   */
  async notifyDrivers(
    orderId: string,
    timeoutSeconds = 120,
  ): Promise<{ notifiedDrivers: number; drivers: Array<{ id: string; name: string; distance: number }> }> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BadRequestException('Pedido no encontrado');
    }

    // Buscar drivers cercanos
    let nearbyDrivers = await this.findAvailableDrivers(orderId, 5, 5);

    // Si no hay drivers en 5km, expandir a 10km
    if (nearbyDrivers.length === 0) {
      this.logger.log('🔄 Expandiendo búsqueda a 10km...');
      nearbyDrivers = await this.findAvailableDrivers(orderId, 10, 5);
    }

    // Si aún no hay drivers, expandir a 15km
    if (nearbyDrivers.length === 0) {
      this.logger.log('🔄 Expandiendo búsqueda a 15km...');
      nearbyDrivers = await this.findAvailableDrivers(orderId, 15, 5);
    }

    if (nearbyDrivers.length === 0) {
      this.logger.warn('❌ No hay drivers disponibles en 15km');
      const previousStatus = order.status;
      await this.orderRepository.update(orderId, {
        status: 'failed',
        cancellationReason: 'No hay drivers disponibles',
      });
      // Registrar en historial
      await this.recordStatusChange(orderId, previousStatus, 'failed', 'system', 'system', {
        reason: 'No hay drivers disponibles en 15km',
      });
      return { notifiedDrivers: 0, drivers: [] };
    }

    // Actualizar estado del pedido
    const acceptDeadline = new Date();
    acceptDeadline.setSeconds(acceptDeadline.getSeconds() + timeoutSeconds);

    const previousStatus = order.status;
    await this.orderRepository.update(orderId, {
      status: 'searching_driver',
      acceptDeadline,
    });

    // Registrar en historial
    await this.recordStatusChange(orderId, previousStatus, 'searching_driver', 'system', 'system', {
      driversNotified: nearbyDrivers.length,
      searchRadius: nearbyDrivers[0]?.distance <= 5 ? 5 : nearbyDrivers[0]?.distance <= 10 ? 10 : 15,
    });

    // Enviar notificaciones push a los drivers
    this.logger.log(`📲 Notificando a ${nearbyDrivers.length} drivers:`);
    
    const notificationPromises = nearbyDrivers.map(async (driver) => {
      this.logger.log(
        `   - ${driver.name} (${driver.distance.toFixed(2)}km de distancia)`,
      );
      
      // Enviar notificación push si el driver tiene token FCM
      if (driver.fcmToken && driver.pushNotificationsEnabled) {
        try {
          await this.notificationsService.notifyNewOrder(
            driver.fcmToken,
            orderId,
            order.total,
            driver.distance,
            order.originFormattedAddress,
          );
          this.logger.log(`   ✅ Notificación push enviada a ${driver.name}`);
        } catch (error) {
          this.logger.error(`   ❌ Error al enviar notificación a ${driver.name}:`, error.message);
        }
      } else {
        this.logger.warn(`   ⚠️ ${driver.name} no tiene notificaciones push habilitadas`);
      }
    });
    
    // Esperar a que todas las notificaciones se envíen
    await Promise.allSettled(notificationPromises);

    return {
      notifiedDrivers: nearbyDrivers.length,
      drivers: nearbyDrivers.map((d) => ({
        id: d.id,
        name: d.name,
        distance: d.distance,
      })),
    };
  }

  /**
   * Driver acepta el pedido
   */
  async acceptOrder(orderId: string, driverId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BadRequestException('Pedido no encontrado');
    }

    // Verificar que el pedido esté buscando driver
    if (order.status !== 'searching_driver') {
      throw new BadRequestException(
        'El pedido no está disponible para asignación',
      );
    }

    // Verificar que no haya expirado
    if (order.acceptDeadline && new Date() > order.acceptDeadline) {
      throw new BadRequestException('El tiempo para aceptar ha expirado');
    }

    // Verificar que el driver esté disponible
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });
    if (!driver) {
      throw new BadRequestException('Driver no encontrado');
    }

    if (driver.status !== 'online' || !driver.isAvailable) {
      throw new BadRequestException('Driver no disponible');
    }

    if (driver.currentOrderId) {
      throw new BadRequestException('Driver ya tiene un pedido asignado');
    }

    // Asignar pedido al driver
    const previousStatus = order.status;
    await this.orderRepository.update(orderId, {
      driverId: driverId,
      status: 'driver_assigned',
      assignedAt: new Date(),
    });

    // Registrar en historial
    await this.recordStatusChange(orderId, previousStatus, 'driver_assigned', driverId, 'driver', {
      driverName: driver.name,
      acceptedAt: new Date(),
    });

    // Actualizar driver
    await this.driverRepository.update(driverId, {
      currentOrderId: orderId,
      status: 'busy',
    });

    this.logger.log(`✅ Pedido ${orderId} asignado a driver ${driver.name}`);

    // Notificar al usuario que se asignó un driver
    try {
      const orderWithUser = await this.orderRepository.findOne({ 
        where: { id: orderId },
        relations: ['user'],
      });
      const user = orderWithUser?.user;
      
      if (user?.fcmToken) {
        // Calcular distancia entre driver y origen del pedido
        const distanceToPickup = driver.currentLatitude && driver.currentLongitude
          ? this.distanceService.calculateWithHaversine(
              { latitude: driver.currentLatitude, longitude: driver.currentLongitude },
              { latitude: order.originLatitude, longitude: order.originLongitude },
            )
          : 0;
        
        // Estimar tiempo de llegada (promedio 30 km/h en ciudad)
        const estimatedTimeMinutes = Math.ceil((distanceToPickup / 30) * 60);
        
        await this.notificationsService.notifyDriverAssigned(
          user.fcmToken,
          orderId,
          driver.name,
          driver.photo || '',
          estimatedTimeMinutes,
        );
        this.logger.log(`📲 Notificación de asignación enviada al usuario`);
      }
    } catch (error) {
      this.logger.error(`Error al notificar al usuario:`, error.message);
    }

    const updatedOrder = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!updatedOrder) {
      throw new BadRequestException('Error al recuperar el pedido actualizado');
    }
    return updatedOrder;
  }

  /**
   * Driver rechaza el pedido
   */
  async rejectOrder(orderId: string, driverId: string, reason?: string): Promise<void> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BadRequestException('Pedido no encontrado');
    }

    // Registrar rechazo en tabla separada
    const rejection = new OrderDriverRejection();
    rejection.orderId = orderId;
    rejection.driverId = driverId;
    rejection.reason = reason as any;
    
    // Calcular distancia si hay ubicaciones
    const driver = await this.driverRepository.findOne({ where: { id: driverId } });
    if (driver?.currentLatitude && driver?.currentLongitude) {
      const distance = this.distanceService.calculateWithHaversine(
        { latitude: order.originLatitude, longitude: order.originLongitude },
        { latitude: driver.currentLatitude, longitude: driver.currentLongitude },
      );
      rejection.distanceKm = distance;
    }

    await this.rejectionRepository.save(rejection);

    // Contar rechazos totales para este pedido
    const rejectionCount = await this.rejectionRepository.count({
      where: { orderId },
    });

    this.logger.log(
      `❌ Driver rechazó pedido ${orderId}. Rechazos totales: ${rejectionCount}`,
    );

    // Si ya rechazaron 5 drivers, marcar como fallido
    if (rejectionCount >= 5) {
      this.logger.warn(`⚠️ Pedido ${orderId} rechazado por 5 drivers. Marcando como fallido.`);
      const previousStatus = order.status;
      await this.orderRepository.update(orderId, {
        status: 'failed',
        cancellationReason: 'Ningún driver aceptó el pedido',
      });
      // Registrar en historial
      await this.recordStatusChange(orderId, previousStatus, 'failed', 'system', 'system', {
        reason: 'Rechazado por 5 drivers',
        totalRejections: rejectionCount,
      });
      return;
    }

    // Intentar reasignar a otro driver
    this.logger.log(`🔄 Intentando reasignar pedido ${orderId}...`);
    await this.notifyDrivers(orderId);
  }
}
