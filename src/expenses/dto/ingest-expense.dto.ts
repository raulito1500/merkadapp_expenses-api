import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngestExpenseDto {
  @ApiProperty({
    example: '$ 59.900',
    description: 'Amount as a formatted string from the external source. Supports COP (dot as thousands separator), USD and EUR formats.',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ example: 'Dominos Pizza order', description: 'Expense description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Raul', description: 'Name or alias of the expense owner' })
  @IsString()
  @IsNotEmpty()
  owner: string;

  @ApiPropertyOptional({ example: 'Domino S Pizza La 10', description: 'Merchant name' })
  @IsOptional()
  @IsString()
  merchant?: string;

  // Fields below are stored as-is in the metadata object

  @ApiPropertyOptional({ example: 'Domino S Pizza La 10', description: 'iOS name field → stored in metadata' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '4.7110', description: 'GPS latitude → stored in metadata' })
  @IsOptional()
  @IsString()
  latitude?: string;

  @ApiPropertyOptional({ example: '-74.0721', description: 'GPS longitude → stored in metadata' })
  @IsOptional()
  @IsString()
  longitude?: string;

  @ApiPropertyOptional({ example: 'Black Mastercard', description: 'Card used for the transaction → stored in metadata' })
  @IsOptional()
  @IsString()
  card?: string;

  @ApiPropertyOptional({ example: 'Pending', description: 'Transaction status from the external source → stored in metadata' })
  @IsOptional()
  @IsString()
  transaction?: string;

  // Catch-all: any unknown field from a future iOS update will be accessible
  // at runtime and routed to metadata, even if not declared above.
  [key: string]: unknown;
}
