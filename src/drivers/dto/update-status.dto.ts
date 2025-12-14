import { IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['offline', 'online', 'busy', 'break'])
  status: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
