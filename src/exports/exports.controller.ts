import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { Response as ExpressResponse } from "express";
import { ExportsService } from "./exports.service";

@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("COACH", "ADMIN", "DIRECTOR")
@Controller("exports")
export class ExportsController {
  constructor(private readonly exportsSvc: ExportsService) {}

  @Get("attendance.csv")
  async rangeCsv(
    @Query("days") days: string | undefined,
    @Res({ passthrough: true }) res: ExpressResponse
  ) {
    const n = Number(days) || 30;
    const csv = await this.exportsSvc.rangeAttendanceCsv(n);

    res.type("text/csv; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="asistencia_${n}dias.csv"`
    );

    return csv;
  }
}