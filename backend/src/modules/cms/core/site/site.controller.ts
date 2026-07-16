import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../../common/authorization/permissions.guard';
import { RequirePermission } from '../../../../common/authorization/require-permission.decorator';
import { Permission } from '../../../../common/authorization/permissions';

/**
 * Admin-only CRUD over Sites (`Site` is technical/routing config, not
 * editorial content — see docs/architecture/CMS_ARCHITECTURE.md §4.10 —
 * so unlike content types there is no public-facing controller here).
 *
 * `@Roles('school_admin')` is the coarse gate (must be an admin at all);
 * `@RequirePermission(Permission.CMS_SITE_MANAGE)` is the fine-grained
 * one on top — same "Roles decides who can hit this at all, Permission
 * decides who can do the sensitive thing" composition every other
 * `@RequirePermission` call site in this codebase uses (see
 * installments.controller.ts / payments.controller.ts). Today
 * CMS_SITE_MANAGE is only granted to school_admin (permissions.ts), so
 * the two guards agree — but PermissionsGuard is what actually enforces
 * it, not the role check alone.
 */
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('school_admin')
@RequirePermission(Permission.CMS_SITE_MANAGE)
@Controller('cms/sites')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get()
  async findAll() {
    return this.siteService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.siteService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSiteDto) {
    return this.siteService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.siteService.update(id, dto);
  }
}
