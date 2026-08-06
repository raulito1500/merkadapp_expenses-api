import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { FindGroupsQueryDto } from './dto/find-groups-query.dto';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List groups visible to an owner (owner or member of)',
  })
  @ApiOkResponse({
    description: 'Groups where the given owner is the creator or a member',
  })
  findAllForOwner(@Query() query: FindGroupsQueryDto) {
    return this.groupsService.findAllForOwner(query.owner);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single group' })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Get(':id/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Per-currency balance summary for a group (equal split across members)',
  })
  getSummary(@Param('id') id: string) {
    return this.groupsService.getSummary(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a group' })
  @ApiCreatedResponse({ description: 'Group created successfully' })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }
}
