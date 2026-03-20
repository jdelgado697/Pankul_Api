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
exports.EvaluationsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const evaluations_service_1 = require("./evaluations.service");
const create_evaluation_dto_1 = require("./dto/create-evaluation.dto");
const update_evaluation_dto_1 = require("./dto/update-evaluation.dto");
let EvaluationsController = class EvaluationsController {
    constructor(evals) {
        this.evals = evals;
    }
    create(dto, req) {
        return this.evals.create(dto, req.user.id);
    }
    findByPlayer(playerId) {
        return this.evals.findByPlayer(playerId);
    }
    findOne(id) {
        return this.evals.findOne(id);
    }
    update(id, dto) {
        return this.evals.update(id, dto);
    }
    remove(id) {
        return this.evals.remove(id);
    }
};
exports.EvaluationsController = EvaluationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_evaluation_dto_1.CreateEvaluationDto, Object]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("player/:playerId"),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR", "PARENT"),
    __param(0, (0, common_1.Param)("playerId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "findByPlayer", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR", "PARENT"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_evaluation_dto_1.UpdateEvaluationDto]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "remove", null);
exports.EvaluationsController = EvaluationsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, common_1.Controller)("evaluations"),
    __metadata("design:paramtypes", [evaluations_service_1.EvaluationsService])
], EvaluationsController);
//# sourceMappingURL=evaluations.controller.js.map