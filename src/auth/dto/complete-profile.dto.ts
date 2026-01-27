import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CompleteProfileDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'El teléfono debe ser un número válido en formato internacional (ej: +573001234567)',
  })
  phone: string;
}
