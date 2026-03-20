import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { DashboardService } from "./dashboard.service";

@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dash: DashboardService) {}

  @Get("coach")
  @Roles("COACH", "ADMIN", "DIRECTOR")
  getCoachDashboard() {
    return this.dash.getCoachDashboard();
  }
}