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

/**
 * Admin-only CRUD over Sites (`Site` is technical/routing config, not
 * editorial content — see docs/architecture/CMS_ARCHITECTURE.md §4.10 —
 * so unlike content types there is no public-facing controller here).
 *
 * Gated with the existing `@Roles('school_admin')` for now. The
 * architecture calls for a dedicated `Permission.CMS_SITE_MANAGE`
 * fine-grained permission on top of this — that enum addition lands in
 * a later CMS-A sub-phase alongside the rest of the CMS permission set,
 * so as not to mix Permission-enum changes into this migration-and-Site
 * foundation step.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('school_admin')
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
