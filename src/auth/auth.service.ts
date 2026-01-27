import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { DriversService } from '../drivers/drivers.service';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { VerificationCode } from './entities/verification-code.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private driversService: DriversService,
    private jwtService: JwtService,
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.comparePasswords(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
    };
  }

  async register(registerDto: { email: string; password: string; name: string; phone: string }) {
    
    try {
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new UnauthorizedException('El usuario ya existe');
      }

      const hashedPassword = await this.hashPassword(registerDto.password);
      
      // Crear usuario sin verificar (isVerified: false por defecto)
      const user = await this.usersService.create({
        ...registerDto,
        password: hashedPassword,
      });

      // Generar código de verificación de 6 dígitos
      const code = this.generateVerificationCode();
      
      // Calcular expiración (10 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Guardar código en base de datos
      const verificationCode = this.verificationCodeRepository.create({
        code,
        userId: user.id,
        type: 'registration',
        expiresAt,
        isUsed: false,
      });

      await this.verificationCodeRepository.save(verificationCode);

      console.log(`📱 Código de verificación para ${user.email}: ${code}`);

      return {
        message: 'Usuario registrado. Verifica tu código para activar tu cuenta.',
        userId: user.id,
        email: user.email
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Genera un código de verificación de 6 dígitos
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Verificar código y activar usuario
   */
  async verifyCode(userId: string, code: string): Promise<any> {
    // Buscar usuario
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar si ya está verificado
    if (user.isVerified) {
      throw new BadRequestException('El usuario ya está verificado');
    }

    // Buscar código válido
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        userId,
        code,
        isUsed: false,
        type: 'registration',
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Código de verificación inválido');
    }

    // Verificar si el código expiró
    if (new Date() > verificationCode.expiresAt) {
      throw new BadRequestException('El código de verificación ha expirado');
    }

    // Marcar código como usado
    verificationCode.isUsed = true;
    verificationCode.usedAt = new Date();
    await this.verificationCodeRepository.save(verificationCode);

    // Actualizar usuario como verificado
    await this.usersService.markAsVerified(user.id);

    // Actualizar objeto user en memoria para el login
    user.isVerified = true;
    user.verifiedAt = new Date();

    // Iniciar sesión y devolver token
    const { password: _, ...userWithoutPassword } = user;
    return this.login(userWithoutPassword);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.usersService.findOne(userId);
  }

  async validateDriver(email: string, password: string): Promise<any> {
    const driver = await this.driversService.findByEmail(email);
    if (driver && await this.comparePasswords(password, driver.password)) {
      const { password: _, ...result } = driver;
      return result;
    }
    return null;
  }

  async loginDriver(driver: any) {
    const payload = { email: driver.email, sub: driver.id, type: 'driver' };
    return {
      access_token: this.jwtService.sign(payload),
      driver: {
        id: driver.id,
        email: driver.email,
        name: driver.name,
        phone: driver.phone,
        status: driver.status,
        verificationStatus: driver.verificationStatus
      },
    };
  }

  async validateDriverById(driverId: string): Promise<any> {
    console.log('validateDriverById', driverId);
    const driver = await this.driversService.findOne(driverId);
    if (!driver) {
      return null;
    }
    return driver;
  }
}
