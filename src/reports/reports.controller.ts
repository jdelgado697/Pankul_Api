import { Controller, Get, Param, Req, UseGuards, ForbiddenException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ReportsService } from "./reports.service";
import { PrismaService } from "../prisma/prisma.service";

@UseGuards(AuthGuard("jwt"))
@Controller("reports")
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly prisma: PrismaService
  ) {}

  private getUser(req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    const role = req.user?.role;
    return { userId, role };
  }

  @Get("team/dashboard")
  getTeamDashboard() {
  return this.reports.getTeamDashboard();
  }

  @Get("player/:playerId/summary")
  async summary(@Req() req: any, @Param("playerId") playerId: string) {
    const { userId, role } = this.getUser(req);

    if (role === "COACH" || role === "ADMIN" || role === "DIRECTOR") {
      return this.reports.getPlayerSummary(playerId);
    }

    const link = await this.prisma.playerGuardian.findUnique({
      where: { playerId_userId: { playerId, userId } },
      select: { canView: true },
    });

    if (!link || !link.canView) {
      throw new ForbiddenException("No tienes permiso para ver este reporte");
    }

    return this.reports.getPlayerSummary(playerId);
  }
}