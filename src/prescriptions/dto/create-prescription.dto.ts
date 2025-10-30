import { ArrayMinSize, IsArray, IsString } from 'class-validator';
import { PrescriptionItemDto } from './item.dto';

export class CreatePrescriptionDto {
  @IsString() patientId!: string;

  @IsArray()
  @ArrayMinSize(1)
  items!: PrescriptionItemDto[];
}
