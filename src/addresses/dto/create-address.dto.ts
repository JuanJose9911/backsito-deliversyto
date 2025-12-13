import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  longitude: number;

  @IsString()
  @IsNotEmpty()
  formattedAddress: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  streetName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  streetNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  neighborhood?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  placeId: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsEnum(['home', 'work', 'other'])
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  alias?: string;

  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;
}
