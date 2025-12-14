import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { CreateDriverDto } from './create-driver.dto';
import { CreateVehicleDto } from './create-vehicle.dto';
import { CreateDriverDocumentDto } from './create-driver-document.dto';

export class RegisterDriverDto extends CreateDriverDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateVehicleDto)
  vehicle: CreateVehicleDto; // Obligatorio: debe registrar un vehículo

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(3) // Mínimo 3 documentos: licencia, antecedentes, ID
  @ValidateNested({ each: true })
  @Type(() => CreateDriverDocumentDto)
  documents: CreateDriverDocumentDto[]; // Obligatorio: documentos mínimos
}
