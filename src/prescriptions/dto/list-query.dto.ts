import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['createdAt', 'consumedAt', 'status'], default: 'createdAt' })
  @IsOptional() @IsString() @IsIn(['createdAt', 'consumedAt', 'status'])
  sortBy?: 'createdAt'|'consumedAt'|'status' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc','desc'], default: 'desc' })
  @IsOptional() @IsString() @IsIn(['asc','desc'])
  order?: 'asc'|'desc' = 'desc';

  @ApiPropertyOptional({ enum: ['PENDING', 'CONSUMED'] })
  @IsOptional() @IsString() @IsIn(['PENDING','CONSUMED'])
  status?: 'PENDING'|'CONSUMED';

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional() @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional() @IsString()
  to?: string;
}
