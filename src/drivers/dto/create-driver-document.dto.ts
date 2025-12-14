import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateDriverDocumentDto {
  @IsEnum([
    'license',
    'background_check',
    'id_document',
    'tax_certificate',
    'bank_certificate',
    'insurance',
  ])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  documentNumber: string; // Obligatorio: número del documento

  @IsString()
  @IsNotEmpty()
  photoUrl: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
