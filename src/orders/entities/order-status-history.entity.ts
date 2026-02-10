import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el pedido
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  @Index('idx_history_order')
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  // Estado anterior
  @Column({ nullable: true })
  fromStatus: string;

  // Estado nuevo
  @Column()
  @Index('idx_history_to_status')
  toStatus: string;

  // Quién realizó el cambio
  @Column()
  changedBy: string; // userId, driverId, o "system"

  // Tipo de entidad que hizo el cambio
  @Column({
    type: 'enum',
    enum: ['user', 'driver', 'system', 'admin'],
  })
  changedByType: string;

  // Metadata adicional (JSON)
  @Column('json', { nullable: true })
  metadata: {
    latitude?: number;
    longitude?: number;
    notes?: string;
    reason?: string;
    [key: string]: any;
  };

  // Timestamp
  @CreateDateColumn()
  changedAt: Date;
}
