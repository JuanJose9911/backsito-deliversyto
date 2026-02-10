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

@Entity('order_driver_rejections')
@Index('idx_rejection_order_driver', ['orderId', 'driverId'])
export class OrderDriverRejection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el pedido
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  @Index('idx_rejection_order')
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  // Driver que rechazó
  @Column()
  @Index('idx_rejection_driver')
  driverId: string;

  // Razón del rechazo (opcional)
  @Column({
    type: 'enum',
    enum: ['too_far', 'busy', 'low_payment', 'difficult_area', 'other'],
    nullable: true,
  })
  reason: string;

  // Comentario adicional
  @Column('text', { nullable: true })
  notes: string;

  // Distancia al momento del rechazo
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  distanceKm: number;

  // Timestamp
  @CreateDateColumn()
  rejectedAt: Date;
}
