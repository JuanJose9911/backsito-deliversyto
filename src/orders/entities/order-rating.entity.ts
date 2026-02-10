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

@Entity('order_ratings')
export class OrderRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el pedido
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  @Index('idx_rating_order')
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  // Quién califica
  @Column()
  @Index('idx_rating_rated_by')
  ratedBy: string; // userId o driverId

  // Tipo de calificación
  @Column({
    type: 'enum',
    enum: ['user_to_driver', 'driver_to_user'],
  })
  ratedType: string;

  // Calificación (1-5 estrellas)
  @Column({ type: 'int' })
  rating: number;

  // Comentario opcional
  @Column('text', { nullable: true })
  review: string;

  // Timestamp
  @CreateDateColumn()
  createdAt: Date;
}
