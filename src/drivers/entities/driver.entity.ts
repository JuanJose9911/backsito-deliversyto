import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // INFORMACIÓN PERSONAL
  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  @Index('idx_driver_email')
  email: string;

  @Column()
  password: string;

  @Column({ unique: true, length: 20 })
  @Index('idx_driver_phone')
  phone: string;

  @Column('text', { nullable: true })
  photo: string; // URL de la foto del repartidor

  @Column('date')
  birthDate: Date;

  @Column({ length: 20 })
  documentType: string; // CC, CE, Pasaporte

  @Column({ unique: true, length: 50 })
  documentNumber: string;

  // REFERENCIA AL VEHÍCULO ACTIVO (se manejará en tabla vehicles)
  @Column({ name: 'active_vehicle_id', nullable: true })
  activeVehicleId: string;

  // UBICACIÓN EN TIEMPO REAL
  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  currentLatitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  currentLongitude: number;

  @Column({ type: 'timestamp', nullable: true })
  lastLocationUpdate: Date;

  // ESTADO Y DISPONIBILIDAD
  @Column({
    type: 'enum',
    enum: ['offline', 'online', 'busy', 'break'],
    default: 'offline',
  })
  @Index('idx_driver_status')
  status: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  isActive: boolean; // Cuenta activa/aprobada por admin

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  })
  verificationStatus: string;

  @Column('text', { nullable: true })
  rejectionReason: string;

  // INFORMACIÓN BANCARIA (para pagos)
  @Column({ nullable: true, length: 100 })
  bankName: string;

  @Column({ nullable: true, length: 50 })
  accountType: string; // Ahorros, Corriente

  @Column({ nullable: true, length: 50 })
  accountNumber: string;

  // ESTADÍSTICAS (solo las que requieren auditoría)
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalEarnings: number; // En pesos colombianos

  // CONFIGURACIÓN DE NOTIFICACIONES
  @Column({ default: true })
  pushNotificationsEnabled: boolean;

  @Column({ default: true })
  smsNotificationsEnabled: boolean;

  @Column('text', { nullable: true })
  fcmToken: string; // Token de Firebase Cloud Messaging para notificaciones push

  // INFORMACIÓN DE EMERGENCIA
  @Column({ nullable: true, length: 100 })
  emergencyContactName: string;

  @Column({ nullable: true, length: 20 })
  emergencyContactPhone: string;

  @Column({ nullable: true, length: 50 })
  emergencyContactRelationship: string;

  // PEDIDO ACTUAL
  @Column({ name: 'current_order_id', nullable: true })
  currentOrderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'current_order_id' })
  currentOrder: Order;

  // Relación con pedidos
  @OneToMany(() => Order, (order) => order.driverId)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
