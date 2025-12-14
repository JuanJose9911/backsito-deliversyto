import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Driver } from './driver.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el repartidor
  @ManyToOne(() => Driver, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  @Index('idx_driver_vehicles')
  driver: Driver;

  // INFORMACIÓN DEL VEHÍCULO
  @Column({
    type: 'enum',
    enum: ['motorcycle', 'bicycle', 'car', 'scooter'],
  })
  type: string;

  @Column({ unique: true, length: 20 })
  @Index('idx_vehicle_plate')
  plate: string;

  @Column({ nullable: true, length: 50 })
  brand?: string;

  @Column({ nullable: true, length: 50 })
  model?: string;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({ nullable: true, length: 50 })
  color?: string;

  // DOCUMENTOS DEL VEHÍCULO
  @Column('text', { nullable: true })
  registrationPhoto?: string; // Tarjeta de propiedad

  @Column('text', { nullable: true })
  soatPhoto?: string; // Seguro obligatorio

  @Column({ type: 'date', nullable: true })
  soatExpiryDate?: Date;

  @Column('text', { nullable: true })
  technicalReviewPhoto?: string; // Revisión técnico mecánica

  @Column({ type: 'date', nullable: true })
  technicalReviewExpiryDate?: Date;

  // ESTADO
  @Column({ default: false })
  isActive: boolean; // Vehículo actualmente en uso por el driver

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  verificationStatus: string;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @Column({ default: true })
  isAvailable: boolean; // Disponible para ser usado

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
