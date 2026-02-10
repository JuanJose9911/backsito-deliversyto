import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/entities/driver.entity';
import { User } from '../users/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Registrar token FCM para driver
   * POST /notifications/register-driver-device
   */
  @Post('register-driver-device')
  @HttpCode(HttpStatus.OK)
  async registerDriverDevice(
    @Request() req: ExpressRequest & { user: any },
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    const driverId = req.user.sub; // ID del driver desde JWT

    // Validar que el token sea válido (opcional pero recomendado)
    const isValid = await this.notificationsService.validateToken(
      registerDeviceDto.fcmToken,
    );

    // Actualizar token del driver
    await this.driverRepository.update(driverId, {
      fcmToken: registerDeviceDto.fcmToken,
    });

    return {
      success: true,
      message: 'Token de dispositivo registrado correctamente',
      tokenValid: isValid,
    };
  }

  /**
   * Registrar token FCM para user
   * POST /notifications/register-user-device
   */
  @Post('register-user-device')
  @HttpCode(HttpStatus.OK)
  async registerUserDevice(
    @Request() req: ExpressRequest & { user: any },
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    const userId = req.user.sub; // ID del user desde JWT

    // Validar que el token sea válido (opcional pero recomendado)
    const isValid = await this.notificationsService.validateToken(
      registerDeviceDto.fcmToken,
    );

    // Actualizar token del user
    await this.userRepository.update(userId, {
      fcmToken: registerDeviceDto.fcmToken,
    });

    return {
      success: true,
      message: 'Token de dispositivo registrado correctamente',
      tokenValid: isValid,
    };
  }

  /**
   * Remover token FCM (logout/uninstall)
   * POST /notifications/unregister-device
   */
  @Post('unregister-device')
  @HttpCode(HttpStatus.OK)
  async unregisterDevice(@Request() req: ExpressRequest & { user: any }) {
    const userId = req.user.sub;
    const userType = req.user.type || 'user'; // 'user' o 'driver'

    if (userType === 'driver') {
      await this.driverRepository.update(userId, { fcmToken: undefined });
    } else {
      await this.userRepository.update(userId, { fcmToken: undefined });
    }

    return {
      success: true,
      message: 'Token de dispositivo removido correctamente',
    };
  }
}
