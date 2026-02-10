import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { DriversService } from '../drivers/drivers.service';
import { SmsService } from '../sms/sms.service';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { VerificationCode } from './entities/verification-code.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private driversService: DriversService,
    private jwtService: JwtService,
    private smsService: SmsService,
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && await this.comparePasswords(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Verificar que el usuario haya confirmado su email
    if (!user.isVerified) {
      throw new UnauthorizedException('Debes verificar tu email antes de iniciar sesión. Revisa el código que te enviamos por SMS.');
    }

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

      // Enviar SMS con código de verificación
      if (user.phone) {
        await this.smsService.sendVerificationCode(user.phone, code);
      }

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
   * Verificar código (funciona para registro y teléfono)
   */
  async verifyCode(userId: string, code: string): Promise<any> {
    // Buscar usuario
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Buscar código válido (cualquier tipo)
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        userId,
        code,
        isUsed: false,
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

    // Aplicar lógica según el tipo de verificación
    if (verificationCode.type === 'registration') {
      // Verificar si ya está verificado
      if (user.isVerified) {
        throw new BadRequestException('El usuario ya está verificado');
      }

      // Actualizar usuario como verificado
      await this.usersService.markAsVerified(user.id);

      // Actualizar objeto user en memoria para el login
      user.isVerified = true;
      user.verifiedAt = new Date();

      // Iniciar sesión y devolver token
      const { password: _, ...userWithoutPassword } = user;
      return this.login(userWithoutPassword);
    } 
    
    if (verificationCode.type === 'phone_verification') {
      // Verificar si ya está completo
      if (user.isProfileComplete) {
        throw new BadRequestException('El perfil ya está completo');
      }

      // Marcar perfil como completo
      await this.usersService.update(userId, {
        isProfileComplete: true,
      });

      return {
        message: 'Teléfono verificado correctamente. Perfil completo.',
        isProfileComplete: true,
      };
    }

    // Otros tipos de verificación en el futuro...
    return {
      message: 'Código verificado correctamente',
    };
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

  /**
   * Validar o crear usuario desde Google OAuth
   */
  async validateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name: string;
    profilePictureUrl?: string;
  }): Promise<User> {
    // Buscar usuario por googleId o email
    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    
    if (!user) {
      user = await this.usersService.findByEmail(googleUser.email);
    }

    // Si el usuario existe, actualizar googleId si no lo tiene
    if (user) {
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        user.profilePictureUrl = googleUser.profilePictureUrl;
        await this.usersService.update(user.id, {
          googleId: user.googleId,
          profilePictureUrl: user.profilePictureUrl,
        });
      }
      return user;
    }

    // Crear nuevo usuario con Google OAuth
    const newUser = await this.usersService.create({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.googleId,
      profilePictureUrl: googleUser.profilePictureUrl,
      isVerified: true, // Los usuarios de Google ya están verificados
      verifiedAt: new Date(),
      isProfileComplete: false, // Necesita completar teléfono
    });

    return newUser;
  }

  /**
   * Login con Google OAuth
   */
  async googleLogin(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profilePictureUrl: user.profilePictureUrl,
        isProfileComplete: user.isProfileComplete,
      },
    };
  }

  /**
   * Completar perfil con teléfono (usuarios de Google OAuth)
   */
  async completeProfile(userId: string, phone: string): Promise<any> {
    // Buscar usuario
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar que sea usuario de Google (tiene googleId)
    if (!user.googleId) {
      throw new BadRequestException('Esta operación solo está disponible para usuarios de Google');
    }

    // Verificar si ya tiene teléfono
    if (user.phone) {
      throw new BadRequestException('El usuario ya tiene un teléfono registrado');
    }

    // Actualizar teléfono
    await this.usersService.update(userId, { phone });

    // Generar código de verificación para el teléfono
    const code = this.generateVerificationCode();
    
    // Calcular expiración (10 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Guardar código en base de datos
    const verificationCode = this.verificationCodeRepository.create({
      code,
      userId: user.id,
      type: 'phone_verification',
      expiresAt,
      isUsed: false,
    });

    await this.verificationCodeRepository.save(verificationCode);

    // Enviar SMS con código de verificación
    await this.smsService.sendVerificationCode(phone, code);

    return {
      message: 'Código de verificación enviado al teléfono',
      phone,
    };
  }
}
