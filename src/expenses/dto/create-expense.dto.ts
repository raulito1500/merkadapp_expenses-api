import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({
    example: 'Team dinner',
    description: 'Short description of the expense',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: 'The Capital Grille',
    description: 'Name of the merchant or place (optional)',
  })
  @IsOptional()
  @IsString()
  merchant?: string;

  @ApiProperty({
    example: 85000,
    description: 'Expense amount (in the specified currency)',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'COP', description: 'ISO 4217 currency code' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    example: '2026-06-30',
    description: 'Date of the expense (ISO 8601)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'Raul',
    description: 'Name or alias of the expense owner',
  })
  @IsString()
  @IsNotEmpty()
  owner: string;
}
