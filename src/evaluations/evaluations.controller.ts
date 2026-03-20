import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { EvaluationsService } from "./evaluations.service";
import { CreateEvaluationDto } from "./dto/create-evaluation.dto";
import { UpdateEvaluationDto } from "./dto/update-evaluation.dto";

@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("evaluations")
export class EvaluationsController {
  constructor(private readonly evals: EvaluationsService) {}

  @Post()
  @Roles("COACH", "ADMIN", "DIRECTOR")
  create(@Body() dto: CreateEvaluationDto, @Req() req: any) {
    return this.evals.create(dto, req.user.id);
  }

  @Get("player/:playerId")
  @Roles("COACH", "ADMIN", "DIRECTOR", "PARENT")
  findByPlayer(@Param("playerId") playerId: string) {
    return this.evals.findByPlayer(playerId);
  }

  @Get(":id")
  @Roles("COACH", "ADMIN", "DIRECTOR", "PARENT")
  findOne(@Param("id") id: string) {
    return this.evals.findOne(id);
  }

  @Patch(":id")
  @Roles("COACH", "ADMIN", "DIRECTOR")
  update(@Param("id") id: string, @Body() dto: UpdateEvaluationDto) {
    return this.evals.update(id, dto);
  }

  @Delete(":id")
  @Roles("COACH", "ADMIN", "DIRECTOR")
  remove(@Param("id") id: string) {
    return this.evals.remove(id);
  }
}