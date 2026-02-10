import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderAssignmentService } from './services/order-assignment.service';
import { CreateOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly assignmentService: OrderAssignmentService,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user.sub;
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user.sub;
    return this.ordersService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.ordersService.findOne(id, userId);
  }

  /**
   * Asignar pedido - buscar y notificar drivers cercanos
   */
  @Post(':id/assign')
  async assignOrder(@Param('id') id: string) {
    return this.assignmentService.notifyDrivers(id);
  }

  /**
   * Driver acepta el pedido
   * TODO: Agregar guard específico para drivers
   */
  @Post(':id/accept')
  async acceptOrder(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user.sub; // Asume que el token JWT contiene el ID del driver
    return this.assignmentService.acceptOrder(id, driverId);
  }

  /**
   * Driver rechaza el pedido
   * TODO: Agregar guard específico para drivers
   */
  @Post(':id/reject')
  async rejectOrder(
    @Param('id') id: string, 
    @Request() req: any,
    @Body() body?: { reason?: string }
  ) {
    const driverId = req.user.sub;
    await this.assignmentService.rejectOrder(id, driverId, body?.reason);
    return { message: 'Pedido rechazado correctamente' };
  }

  /**
   * Driver inicia viaje al origen para recoger
   * TODO: Agregar guard específico para drivers
   */
  @Post(':id/start-pickup')
  async startPickup(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user.sub;
    return this.ordersService.startPickup(id, driverId);
  }

  /**
   * Driver confirma que recogió el paquete
   * TODO: Agregar guard específico para drivers
   */
  @Post(':id/confirm-pickup')
  async confirmPickup(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user.sub;
    return this.ordersService.confirmPickup(id, driverId);
  }

  /**
   * Driver inicia viaje al destino
   * TODO: Agregar guard específico para drivers
   */
  @Post(':id/start-delivery')
  async startDelivery(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user.sub;
    return this.ordersService.startDelivery(id, driverId);
  }

  /**
   * Driver completa la entrega - LIBERA AL DRIVER
   * TODO: Agregar guard específico para drivers
   */
  @Post(':id/complete')
  async completeOrder(
    @Param('id') id: string, 
    @Request() req: any,
    @Body() body?: { verificationCode?: string }
  ) {
    const driverId = req.user.sub;
    return this.ordersService.completeOrder(id, driverId, body?.verificationCode);
  }

  /**
   * Usuario cancela el pedido - LIBERA AL DRIVER si estaba asignado
   */
  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string, 
    @Request() req: any,
    @Body() body: { reason: string }
  ) {
    const userId = req.user.sub;
    return this.ordersService.cancelOrder(id, userId, body.reason);
  }
}
