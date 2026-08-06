import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindGroupsQueryDto {
  @ApiProperty({
    example: 'Raul',
    description: 'Only groups visible to this owner (owner or member of)',
  })
  @IsString()
  @IsNotEmpty()
  owner: string;
}
