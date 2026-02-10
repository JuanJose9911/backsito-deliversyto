import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsNotEmpty({ message: 'El token FCM es requerido' })
  @IsString({ message: 'El token FCM debe ser un string' })
  fcmToken: string;
}
