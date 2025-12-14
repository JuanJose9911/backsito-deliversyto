import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  verificationStatus?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
