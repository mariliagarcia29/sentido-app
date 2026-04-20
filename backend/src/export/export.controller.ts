import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateExportDto } from './dto/create-export.dto';

@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  requestExport(@CurrentUser() user: User, @Body() dto: CreateExportDto) {
    return this.exportService.requestExport(user.id, dto);
  }

  @Get()
  getAll(@CurrentUser() user: User) {
    return this.exportService.getAll(user.id);
  }

  @Get(':id')
  getDownload(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exportService.getDownloadUrl(id, user.id);
  }
}
