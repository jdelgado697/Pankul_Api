import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { MeService } from "./me.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("PARENT", "COACH", "ADMIN", "DIRECTOR")
@Controller("me")
export class MeController {
  constructor(private readonly me: MeService) {}

  private getUserId(req: any) {
    return req.user?.sub || req.user?.userId || req.user?.id;
  }

  @Get("players")
  players(@Req() req: any) {
    return this.me.players(this.getUserId(req));
  }

  @Get("profile")
  profile(@Req() req: any) {
    return this.me.profile(this.getUserId(req));
  }
}