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
import { Driver } from './driver.entity';

@Entity('driver_documents')
export class DriverDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el repartidor
  @ManyToOne(() => Driver, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  @Index('idx_driver_documents')
  driver: Driver;

  // TIPO DE DOCUMENTO
  @Column({
    type: 'enum',
    enum: [
      'license',           // Licencia de conducción
      'background_check',  // Certificado de antecedentes
      'id_document',       // Documento de identidad
      'tax_certificate',   // RUT o certificado tributario
      'bank_certificate',  // Certificado bancario
      'insurance',         // Póliza de seguro personal
    ],
  })
  @Index('idx_document_type')
  type: string;

  // INFORMACIÓN DEL DOCUMENTO
  @Column({ nullable: true, length: 100 })
  documentNumber?: string;

  @Column('text')
  photoUrl: string; // URL del documento escaneado/foto

  @Column({ type: 'date', nullable: true })
  issueDate?: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  // ESTADO DEL DOCUMENTO
  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
  })
  @Index('idx_document_status')
  status: string;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true, length: 100 })
  reviewedBy: string; // ID del admin que revisó

  // VERSIÓN (para renovaciones)
  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ default: true })
  isCurrent: boolean; // True solo para la versión más reciente

  // NOTAS DEL ADMINISTRADOR
  @Column('text', { nullable: true })
  adminNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
