import {
  IsBooleanString,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindExpensesQueryDto {
  @ApiPropertyOptional({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description: 'Only return expenses belonging to this group',
  })
  @IsOptional()
  @IsMongoId()
  groupId?: string;

  @ApiPropertyOptional({ example: 'Raul', description: 'Owner to filter by' })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({
    example: 'true',
    description:
      "Combined with owner, returns only that owner's private expenses (groupId null)",
  })
  @IsOptional()
  @IsBooleanString()
  personal?: string;
}
