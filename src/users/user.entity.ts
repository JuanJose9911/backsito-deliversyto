import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Address } from '../addresses/address.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ unique: true, nullable: true })
  googleId?: string;

  @Column()
  name: string; 
  
  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  profilePictureUrl?: string;

  @Column({ default: false })
  isProfileComplete: boolean; 

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column('text', { nullable: true })
  fcmToken?: string; // Token de Firebase Cloud Messaging para notificaciones push

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}