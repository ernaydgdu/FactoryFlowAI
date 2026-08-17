import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardSummaryService } from './dashboard-summary.service';
import { AlertsService } from './alerts.service';
import { AnalyticsService } from './analytics.service';
import { ChatAssistantService } from './chat-assistant.service';
import { RiskyOrdersService } from './risky-orders.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [DashboardController],
  providers: [
    DashboardSummaryService,
    AlertsService,
    AnalyticsService,
    ChatAssistantService,
    RiskyOrdersService,
  ],
})
export class DashboardModule {}
