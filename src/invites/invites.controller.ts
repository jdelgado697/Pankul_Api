  import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { InvitesService } from "./invites.service";

@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("COACH", "ADMIN", "DIRECTOR")
@Controller("invites")
export class InvitesController {
  constructor(private invites: InvitesService) {}

  // ✅ Coach/Admin genera código
  @Post()
  create(@Body() body: { playerId: string; relation?: string; daysValid?: number; canView?: boolean }) {
    return this.invites.createInvite(body);
  }
}
