import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto';
import { PricingService } from './services/pricing.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private pricingService: PricingService,
  ) {}

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
}
