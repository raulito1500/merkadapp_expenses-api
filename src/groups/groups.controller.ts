import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';

@ApiTags('groups')
@Controller('groups')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List groups visible to the caller (owner or member of)',
  })
  @ApiOkResponse({
    description: 'Groups where the caller is the creator or a member',
  })
  findAllForOwner(@Req() req: AuthenticatedRequest) {
    return this.groupsService.findAllForOwner(req.user.uid);
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
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto, req.user.uid);
  }
}
