import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { RolesGuard } from "../auth/roles.guard";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("COACH", "ADMIN", "DIRECTOR")
@Controller("sessions")
export class SessionsController {
  constructor(private sessions: SessionsService) {}

  @Get()
  list() {
    return this.sessions.list();
  }

  @Post()
  create(@Body() body: any) {
    return this.sessions.create(body);
  } 

  // ✅ ESTE ES EL QUE TE FALTA (lo que daba 404)
  @Post(":sessionId/attendance/bulk")
  bulkAttendance(
    @Param("sessionId") sessionId: string,
    @Body() body: { items: { playerId: string; status: "PRESENT" | "ABSENT" | "LATE"; note?: string }[] }
  ) {
    return this.sessions.bulkAttendance(sessionId, body.items || []);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.sessions.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.sessions.remove(id);
  }
}