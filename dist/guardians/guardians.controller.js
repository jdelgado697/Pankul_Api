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
exports.GuardiansController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const guardians_service_1 = require("./guardians.service");
let GuardiansController = class GuardiansController {
    constructor(guardians) {
        this.guardians = guardians;
    }
    getInvite(code) {
        return this.guardians.getInvite(code);
    }
    acceptInvite(body) {
        return this.guardians.acceptInvite(body);
    }
    list() {
        return this.guardians.list();
    }
    create(body) {
        return this.guardians.create(body);
    }
    invite(body) {
        return this.guardians.invite(body.email, body.playerId);
    }
    createInvite(body) {
        return this.guardians.createInvite(body);
    }
    link(body) {
        return this.guardians.link(body);
    }
    listForPlayer(playerId) {
        return this.guardians.listForPlayer(playerId);
    }
    unlink(body) {
        return this.guardians.unlink(body.userId, body.playerId);
    }
    updateLink(body) {
        return this.guardians.updateLink(body.userId, body.playerId, {
            relation: body.relation,
            canView: body.canView,
        });
    }
    getOne(id) {
        return this.guardians.getOne(id);
    }
    update(id, body) {
        return this.guardians.update(id, body);
    }
    remove(id) {
        return this.guardians.remove(id);
    }
};
exports.GuardiansController = GuardiansController;
__decorate([
    (0, common_1.Get)("invite/:code"),
    __param(0, (0, common_1.Param)("code")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "getInvite", null);
__decorate([
    (0, common_1.Post)("accept-invite"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Post)("invite"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "invite", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Post)("create-invite"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "createInvite", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Post)("link"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "link", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Get)("player/:playerId"),
    __param(0, (0, common_1.Param)("playerId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "listForPlayer", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Post)("unlink"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "unlink", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Patch)("update"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "updateLink", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "getOne", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("COACH", "ADMIN", "DIRECTOR"),
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GuardiansController.prototype, "remove", null);
exports.GuardiansController = GuardiansController = __decorate([
    (0, common_1.Controller)("guardians"),
    __metadata("design:paramtypes", [guardians_service_1.GuardiansService])
], GuardiansController);
//# sourceMappingURL=guardians.controller.js.map