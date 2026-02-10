import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Address } from '../../addresses/address.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el usuario que hace el pedido
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  @Index('idx_order_user')
  user: User;

  // Referencias opcionales a direcciones guardadas
  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'origin_address_id' })
  originAddress: Address;

  @Column({ name: 'origin_address_id', nullable: true })
  originAddressId: string;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'destination_address_id' })
  destinationAddress: Address;

  @Column({ name: 'destination_address_id', nullable: true })
  destinationAddressId: string;

  // DIRECCIÓN DE ORIGEN (snapshot desnormalizado)
  @Column('decimal', { precision: 10, scale: 8 })
  originLatitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  originLongitude: number;

  @Column('text')
  originFormattedAddress: string;

  @Column('text', { nullable: true })
  originInstructions?: string;

  // DIRECCIÓN DE DESTINO (snapshot desnormalizado)
  @Column('decimal', { precision: 10, scale: 8 })
  destinationLatitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  destinationLongitude: number;

  @Column('text')
  destinationFormattedAddress: string;

  @Column('text', { nullable: true })
  destinationInstructions?: string;

  // DESCRIPCIÓN DEL PEDIDO
  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['document', 'package', 'food', 'other'],
    default: 'package',
  })
  packageType: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  packageWeight: number; // En kg

  @Column('json', { nullable: true })
  packageDimensions: {
    length: number;
    width: number;
    height: number;
  };

  // DATOS DE DISTANCIA Y TIEMPO (de Google Distance Matrix)
  @Column('decimal', { precision: 8, scale: 2 })
  distanceKm: number;

  @Column('int')
  estimatedDurationMinutes: number;

  // COSTOS (en pesos colombianos)
  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number; // Precio base

  @Column('decimal', { precision: 10, scale: 2 })
  distanceFee: number; // Costo por distancia

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  timeFee: number; // Costo por tiempo (opcional)

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  serviceFee: number; // Comisión de la plataforma

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tip: number; // Propina

  @Column('decimal', { precision: 10, scale: 2 })
  total: number; // Total a pagar

  // NOTA: Datos de pago ahora están en la entidad Payment
  // Mantener método de pago aquí por conveniencia en queries
  @Column({
    type: 'enum',
    enum: ['cash', 'card', 'wallet'],
    default: 'cash',
  })
  paymentMethod: string;

  // ESTADO DEL PEDIDO
  @Column({
    type: 'enum',
    enum: [
      'pending',           // Pendiente (en resumen, esperando confirmación)
      'confirmed',         // Confirmado (usuario aceptó el precio)
      'searching_driver',  // Buscando repartidor
      'driver_assigned',   // Repartidor asignado
      'picking_up',        // Repartidor en camino al origen
      'picked_up',         // Paquete recogido
      'in_transit',        // En camino al destino
      'delivered',         // Entregado
      'cancelled',         // Cancelado
      'failed',            // Fallido
    ],
    default: 'pending',
  })
  @Index('idx_order_status')
  status: string;

  // Referencia al repartidor asignado (se manejará en tabla separada)
  @Column({ name: 'driver_id', nullable: true })
  driverId: string;

  // ASIGNACIÓN DE DRIVER
  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptDeadline: Date; // Tiempo límite para que el driver acepte (30 segundos)

  // NOTA: rejectionCount y rejectedByDrivers ahora están en OrderDriverRejection
  // NOTA: timestamps del ciclo de vida ahora están en OrderStatusHistory

  // CÓDIGO DE VERIFICACIÓN PARA ENTREGA
  @Column({ nullable: true, length: 6 })
  verificationCode: string;

  @Column({ default: false })
  isVerified: boolean;

  // NOTA: Calificaciones ahora están en OrderRating (usuario y driver se califican mutuamente)

  // CANCELACIÓN
  @Column({ nullable: true, length: 100 })
  cancelledBy: string; // user, driver, system

  @Column('text', { nullable: true })
  cancellationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
