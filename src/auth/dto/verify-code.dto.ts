import { IsNotEmpty, IsString, Length, IsUUID } from 'class-validator';

export class VerifyCodeDto {
  @IsUUID('4', { message: 'El userId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El userId es requerido' })
  userId: string;

  @IsString({ message: 'El código debe ser un texto' })
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
  code: string;
}
