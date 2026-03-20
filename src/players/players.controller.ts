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
import { PlayersService } from "./players.service";

@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("players")
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @Roles("COACH", "ADMIN", "DIRECTOR")
  findAll() {
    return this.playersService.findAll();
  }

  @Get(":id")
  @Roles("COACH", "ADMIN", "DIRECTOR")
  findOne(@Param("id") id: string) {
    return this.playersService.findOne(id);
  }

  @Post()
  @Roles("COACH", "ADMIN", "DIRECTOR")
  create(@Body() body: any) {
    return this.playersService.create(body);
  }

  @Patch(":id")
  @Roles("COACH", "ADMIN", "DIRECTOR")
  update(@Param("id") id: string, @Body() body: any) {
    return this.playersService.update(id, body);
  }

  @Delete(":id")
  @Roles("COACH", "ADMIN", "DIRECTOR")
  remove(@Param("id") id: string) {
    return this.playersService.remove(id);
  }
}