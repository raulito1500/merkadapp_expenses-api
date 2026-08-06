import { IsMongoId, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoveExpenseDto {
  @ApiPropertyOptional({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description:
      'Target group id. Omit or send null to move the expense back to private.',
    nullable: true,
  })
  @IsOptional()
  @IsMongoId()
  groupId?: string | null;
}
