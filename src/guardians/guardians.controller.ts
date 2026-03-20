import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { GuardiansService } from "./guardians.service";

@Controller("guardians")
export class GuardiansController {
  constructor(private readonly guardians: GuardiansService) {}

  // ---------------- PUBLICO ----------------

  @Get("invite/:code")
  getInvite(@Param("code") code: string) {
    return this.guardians.getInvite(code);
  }

  @Post("accept-invite")
  acceptInvite(
    @Body()
    body: {
      code: string;
      fullName: string;
      email: string;
      password: string;
    }
  ) {
    return this.guardians.acceptInvite(body);
  }

  // ---------------- PROTEGIDO ----------------

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Get()
  list() {
    return this.guardians.list();
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Post()
  create(
    @Body()
    body: {
      fullName: string;
      email: string;
      password?: string;
    }
  ) {
    return this.guardians.create(body);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Post("invite")
  invite(
    @Body()
    body: {
      email: string;
      playerId: string;
    }
  ) {
    return this.guardians.invite(body.email, body.playerId);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Post("create-invite")
  createInvite(
    @Body()
    body: {
      playerId: string;
      relation?: string;
      canView?: boolean;
      expiresAt?: Date;
    }
  ) {
    return this.guardians.createInvite(body);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Post("link")
  link(
    @Body()
    body: {
      userId: string;
      playerId: string;
      relation?: string;
      canView?: boolean;
    }
  ) {
    return this.guardians.link(body);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Get("player/:playerId")
  listForPlayer(@Param("playerId") playerId: string) {
    return this.guardians.listForPlayer(playerId);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Post("unlink")
  unlink(@Body() body: { userId: string; playerId: string }) {
    return this.guardians.unlink(body.userId, body.playerId);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Patch("update")
  updateLink(
    @Body()
    body: {
      userId: string;
      playerId: string;
      relation?: string;
      canView?: boolean;
    }
  ) {
    return this.guardians.updateLink(body.userId, body.playerId, {
      relation: body.relation,
      canView: body.canView,
    });
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.guardians.getOne(id);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: {
      fullName?: string;
      email?: string;
      password?: string;
    }
  ) {
    return this.guardians.update(id, body);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("COACH", "ADMIN", "DIRECTOR")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.guardians.remove(id);
  }
}