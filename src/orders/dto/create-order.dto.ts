import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  originLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  originLongitude: number;

  @IsNotEmpty()
  @IsString()
  originAddress: string;

  @IsOptional()
  @IsString()
  originDetails?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  destinationLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  destinationLongitude: number;

  @IsNotEmpty()
  @IsString()
  destinationAddress: string;

  @IsOptional()
  @IsString()
  destinationDetails?: string;

  @IsNotEmpty()
  @IsEnum(['motorcycle', 'car', 'bicycle'])
  vehicleType: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
