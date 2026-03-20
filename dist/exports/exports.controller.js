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
exports.ExportsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const exports_service_1 = require("./exports.service");
let ExportsController = class ExportsController {
    constructor(exportsSvc) {
        this.exportsSvc = exportsSvc;
    }
    async rangeCsv(days, res) {
        const n = Number(days) || 30;
        const csv = await this.exportsSvc.rangeAttendanceCsv(n);
        res.type("text/csv; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Disposition", `attachment; filename="asistencia_${n}dias.csv"`);
        return csv;
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, common_1.Get)("attendance.csv"),
    __param(0, (0, common_1.Query)("days")),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "rangeCsv", null);
exports.ExportsController = ExportsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Controller)("exports"),
    __metadata("design:paramtypes", [exports_service_1.ExportsService])
], ExportsController);
//# sourceMappingURL=exports.controller.js.map