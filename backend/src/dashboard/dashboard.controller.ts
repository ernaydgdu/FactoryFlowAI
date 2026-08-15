import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, type JwtPayloadUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  async getDashboard(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.dashboardService.getDashboard(scope);
  }

  @Get('alerts')
  async getAlerts(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.dashboardService.getAlerts(scope);
  }
}
