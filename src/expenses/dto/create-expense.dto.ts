import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsMongoId,
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

  @ApiProperty({
    example: 'Raul',
    description: 'Name of the group member who actually paid',
  })
  @IsString()
  @IsNotEmpty()
  paidBy: string;

  @ApiPropertyOptional({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description:
      'Target group id. Omit to keep the expense private (visible only to its owner).',
  })
  @IsOptional()
  @IsMongoId()
  groupId?: string;
}
