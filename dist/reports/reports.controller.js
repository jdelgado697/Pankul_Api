"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const reports_service_1 = require("./reports.service");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsController = class ReportsController {
    constructor(reports, prisma) {
        this.reports = reports;
        this.prisma = prisma;
    }
    getUser(req) {
        const userId = req.user?.sub || req.user?.userId || req.user?.id;
        const role = req.user?.role;
        return { userId, role };
    }
    getTeamDashboard() {
        return this.reports.getTeamDashboard();
    }
    async summary(req, playerId) {
        const { userId, role } = this.getUser(req);
        if (role === "COACH" || role === "ADMIN" || role === "DIRECTOR") {
            return this.reports.getPlayerSummary(playerId);
        }
        const link = await this.prisma.playerGuardian.findUnique({
            where: { playerId_userId: { playerId, userId } },
            select: { canView: true },
        });
        if (!link || !link.canView) {
            throw new common_1.ForbiddenException("No tienes permiso para ver este reporte");
        }
        return this.reports.getPlayerSummary(playerId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)("team/dashboard"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getTeamDashboard", null);
__decorate([
    (0, common_1.Get)("player/:playerId/summary"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("playerId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "summary", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, common_1.Controller)("reports"),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        prisma_service_1.PrismaService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map