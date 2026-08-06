import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'Roommates', description: 'Group name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Raul',
    description: 'Name or alias of the group creator',
  })
  @IsString()
  @IsNotEmpty()
  owner: string;

  @ApiPropertyOptional({
    example: ['Raul', 'Manu', 'Diana'],
    description:
      'Names or aliases of the group members (the owner is always included)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  members?: string[];
}
