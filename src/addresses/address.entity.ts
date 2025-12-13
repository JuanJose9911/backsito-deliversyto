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
import { User } from '../users/user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // Coordenadas - CRÍTICO para cálculos de distancia y mapas
  @Index('idx_latitude')
  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Index('idx_longitude')
  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  // Dirección formateada completa de Google
  @Column('text')
  formattedAddress: string;

  // Componentes individuales normalizados
  @Column({ nullable: true, length: 100 })
  streetName: string;

  @Column({ nullable: true, length: 20 })
  streetNumber: string;

  @Column({ nullable: true, length: 100 })
  neighborhood: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column({ length: 100 })
  country: string;

  @Column({ nullable: true, length: 20 })
  postalCode: string;

  // ID único de Google Places
  @Column({ unique: true, length: 255 })
  @Index('idx_place_id')
  placeId: string;

  // Instrucciones de entrega (Apto, timbre, referencias)
  @Column('text', { nullable: true })
  instructions: string;

  // Etiqueta predefinida
  @Column({
    type: 'enum',
    enum: ['home', 'work', 'other'],
    default: 'other',
  })
  label: string;

  // Alias personalizado del usuario
  @Column({ nullable: true, length: 50 })
  alias: string;

  // Dirección favorita/predeterminada
  @Column({ default: false })
  isFavorite: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
