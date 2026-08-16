import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardSummaryService } from './dashboard-summary.service';
import { AlertsService } from './alerts.service';
import { AnalyticsService } from './analytics.service';
import { ChatAssistantService } from './chat-assistant.service';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardSummaryService,
    AlertsService,
    AnalyticsService,
    ChatAssistantService,
  ],
})
export class DashboardModule {}
