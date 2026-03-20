"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const players_module_1 = require("./players/players.module");
const sessions_module_1 = require("./sessions/sessions.module");
const evaluations_module_1 = require("./evaluations/evaluations.module");
const reports_module_1 = require("./reports/reports.module");
const guardians_module_1 = require("./guardians/guardians.module");
const me_module_1 = require("./me/me.module");
const invites_module_1 = require("./invites/invites.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const exports_module_1 = require("./exports/exports.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, players_module_1.PlayersModule, sessions_module_1.SessionsModule, evaluations_module_1.EvaluationsModule, reports_module_1.ReportsModule, guardians_module_1.GuardiansModule, me_module_1.MeModule, invites_module_1.InvitesModule, dashboard_module_1.DashboardModule, exports_module_1.ExportsModule],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map