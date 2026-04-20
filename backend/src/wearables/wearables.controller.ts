import { Controller, Get, Post, Delete, Body, Param, Query, Res, Headers, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { WearablesService } from './wearables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PushWearableDataDto } from './dto/push-wearable-data.dto';
import { WearableSource, WearableDataType } from './entities/wearable-data.entity';

@Controller('wearables')
export class WearablesController {
  constructor(private readonly wearables: WearablesService) {}

  // ── Conexões ─────────────────────────────────────────────────────────────────

  @Get('connections')
  @UseGuards(JwtAuthGuard)
  getConnections(@CurrentUser() user: User) {
    return this.wearables.getConnections(user.id);
  }

  @Delete('connections/:provider')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: User, @Param('provider') provider: WearableSource) {
    return this.wearables.disconnect(user.id, provider);
  }

  // ── Fitbit OAuth ──────────────────────────────────────────────────────────────

  @Get('fitbit/connect')
  @UseGuards(JwtAuthGuard)
  fitbitConnect(@CurrentUser() user: User, @Res() res: Response) {
    const url = this.wearables.getFitbitAuthUrl(user.id);
    return res.redirect(url);
  }

  @Get('fitbit/callback')
  async fitbitCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.wearables.fitbitCallback(code, state);
    return res.redirect(`${process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'}/wearables?connected=fitbit`);
  }

  @Post('fitbit/sync')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  syncFitbit(@CurrentUser() user: User) {
    return this.wearables.syncFitbit(user.id);
  }

  // ── Garmin ────────────────────────────────────────────────────────────────────

  @Get('garmin/connect')
  @UseGuards(JwtAuthGuard)
  garminConnect(@Res() res: Response) {
    return res.redirect(this.wearables.getGarminAuthUrl());
  }

  // Garmin Health API envia dados por webhook — verificado via shared secret no header
  @Post('garmin/push')
  handleGarminWebhook(
    @Headers('x-garmin-verification-token') token: string,
    @Body() body: Record<string, any>,
  ) {
    return this.wearables.handleGarminWebhook(token, body);
  }

  // ── Push manual — mobile envia dados do HealthKit / Health Connect ────────────

  @Post('data')
  @UseGuards(JwtAuthGuard)
  pushData(@CurrentUser() user: User, @Body() dto: PushWearableDataDto) {
    return this.wearables.pushData(user.id, dto);
  }

  // ── Consultas de dados ────────────────────────────────────────────────────────

  @Get('data')
  @UseGuards(JwtAuthGuard)
  getData(
    @CurrentUser() user: User,
    @Query('type') dataType?: WearableDataType,
    @Query('days') days?: string,
  ) {
    return this.wearables.getData(user.id, dataType, days ? parseInt(days, 10) : 30);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  getSummary(@CurrentUser() user: User) {
    return this.wearables.getSummary(user.id);
  }
}
