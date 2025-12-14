import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  @IsNotEmpty()
  documentType: string; // CC, CE, Passport

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelationship?: string;
}
