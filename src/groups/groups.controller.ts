import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupCurrencySummary } from './dto/group-summary.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { UsersService } from '../users/users.service';
import { UserSummary } from '../users/dto/user-summary.dto';
import { GroupDocument } from './schemas/group.schema';

@ApiTags('groups')
@Controller('groups')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List groups visible to the caller (owner or member of)',
  })
  @ApiOkResponse({
    description: 'Groups where the caller is the creator or a member',
  })
  async findAllForOwner(@Req() req: AuthenticatedRequest) {
    const groups = await this.groupsService.findAllForOwner(req.user.uid);
    const usersByUid = await this.usersService.resolveMany(
      groups.flatMap((group) => [group.owner, ...group.members]),
    );
    return groups.map((group) => this.enrichGroup(group, usersByUid));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single group' })
  async findOne(@Param('id') id: string) {
    const group = await this.groupsService.findOne(id);
    if (!group) {
      return group;
    }
    const usersByUid = await this.usersService.resolveMany([
      group.owner,
      ...group.members,
    ]);
    return this.enrichGroup(group, usersByUid);
  }

  @Get(':id/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Per-currency balance summary for a group (equal split across members)',
  })
  async getSummary(@Param('id') id: string) {
    const summary = await this.groupsService.getSummary(id);
    return this.enrichSummary(summary);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a group' })
  @ApiCreatedResponse({ description: 'Group created successfully' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto, req.user.uid);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a group' })
  @ApiOkResponse({ description: 'Group updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    const group = await this.groupsService.update(id, dto);
    const usersByUid = await this.usersService.resolveMany([
      group.owner,
      ...group.members,
    ]);
    return this.enrichGroup(group, usersByUid);
  }

  private enrichGroup(
    group: GroupDocument,
    usersByUid: Map<string, UserSummary>,
  ) {
    return {
      ...group.toObject(),
      owner: this.usersService.resolveOne(usersByUid, group.owner),
      members: group.members.map((uid) =>
        this.usersService.resolveOne(usersByUid, uid),
      ),
    };
  }

  private async enrichSummary(summary: GroupCurrencySummary[]) {
    const uids = summary.flatMap((currency) =>
      currency.members.map((member) => member.uid),
    );
    const usersByUid = await this.usersService.resolveMany(uids);
    return summary.map((currency) => ({
      ...currency,
      members: currency.members.map((member) => ({
        user: this.usersService.resolveOne(usersByUid, member.uid),
        paid: member.paid,
        balance: member.balance,
      })),
    }));
  }
}
