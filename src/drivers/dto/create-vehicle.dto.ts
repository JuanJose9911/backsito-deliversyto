import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateVehicleDto {
  @IsEnum(['motorcycle', 'bicycle', 'car', 'scooter'])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsNotEmpty()
  brand: string; // Obligatorio

  @IsString()
  @IsNotEmpty()
  model: string; // Obligatorio

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  registrationPhoto?: string;

  @IsOptional()
  @IsString()
  soatPhoto?: string;

  @IsOptional()
  @IsDateString()
  soatExpiryDate?: string;

  @IsOptional()
  @IsString()
  technicalReviewPhoto?: string;

  @IsOptional()
  @IsDateString()
  technicalReviewExpiryDate?: string;
}
