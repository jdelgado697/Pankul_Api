import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      status: "ok",
      app: "Pankul API",
      time: new Date(),
    };
  }
}