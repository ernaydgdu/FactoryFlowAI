import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { DashboardSummaryService } from './dashboard-summary.service';
import { AlertsService } from './alerts.service';
import { AnalyticsService } from './analytics.service';
import { ChatAssistantService } from './chat-assistant.service';
import { RiskyOrdersService } from './risky-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private dashboardSummaryService: DashboardSummaryService,
    private alertsService: AlertsService,
    private analyticsService: AnalyticsService,
    private chatAssistantService: ChatAssistantService,
    private riskyOrdersService: RiskyOrdersService,
  ) {}

  @Get()
  async getDashboard(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.dashboardSummaryService.getDashboard(scope);
  }

  @Get('alerts')
  async getAlerts(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.alertsService.getAlerts(scope);
  }

  @Get('quality-summary')
  async getQualitySummary(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.analyticsService.getQualitySummary(scope);
  }

  @Get('risky-orders')
  async getRiskyOrders(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.riskyOrdersService.getRiskyOrders(scope);
  }

  @Get('supplier-performance')
  async getSupplierPerformance(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.analyticsService.getSupplierPerformance(scope);
  }

  @Get('subcontractor-performance')
  async getSubcontractorPerformance(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.analyticsService.getSubcontractorPerformance(scope);
  }

  @Post('ai-advice')
  async getAiAdvice(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    const advice = await this.chatAssistantService.getAiAdvice(scope);
    return { advice };
  }

  @Post('ask')
  async ask(
    @CurrentUser() user: JwtPayloadUser,
    @Body('question') question: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    const answer = await this.chatAssistantService.answerQuestion(
      question,
      scope,
    );
    return { answer };
  }
}
