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
import { Order } from './order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el pedido
  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  @Index('idx_payment_order')
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  // Monto
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  // Método de pago
  @Column({
    type: 'enum',
    enum: ['cash', 'card', 'wallet', 'pse', 'nequi', 'daviplata'],
  })
  paymentMethod: string;

  // Estado del pago
  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  })
  @Index('idx_payment_status')
  status: string;

  // ID externo (Stripe, PSE, etc.)
  @Column({ nullable: true })
  @Index('idx_payment_external')
  externalId: string;

  // Proveedor de pago
  @Column({ nullable: true })
  provider: string; // 'stripe', 'mercadopago', 'wompi', etc.

  // Metadata del pago
  @Column('json', { nullable: true })
  metadata: {
    cardLast4?: string;
    cardBrand?: string;
    receiptUrl?: string;
    [key: string]: any;
  };

  // Error si falló
  @Column('text', { nullable: true })
  errorMessage: string;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;
}
