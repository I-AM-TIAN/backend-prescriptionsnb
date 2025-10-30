import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PrescriptionItemDto {
  @IsString()
  name!: string;

  @IsOptional() @IsString()
  dose?: string;

  @IsOptional() @IsInt() @Min(1)
  quantity?: number;

  @IsOptional() @IsString()
  notes?: string;
}
