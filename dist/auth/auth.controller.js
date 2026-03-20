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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
class LoginDto {
}
class RefreshDto {
}
class ForgotPasswordDto {
}
class ResetPasswordDto {
}
class ChangePasswordDto {
}
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    login(body) {
        if (!body?.email || !body?.password) {
            throw new common_1.BadRequestException("Email y contraseña son obligatorios");
        }
        return this.authService.login(body.email, body.password);
    }
    refresh(body) {
        if (!body?.refreshToken) {
            throw new common_1.BadRequestException("refreshToken es obligatorio");
        }
        return this.authService.refresh(body.refreshToken);
    }
    logout(body) {
        if (!body?.refreshToken) {
            throw new common_1.BadRequestException("refreshToken es obligatorio");
        }
        return this.authService.logout(body.refreshToken);
    }
    async forgotPassword(body) {
        if (!body?.email) {
            throw new common_1.BadRequestException("Email es obligatorio");
        }
        await this.authService.forgotPassword(body.email);
        return { message: "Si el correo existe, se enviaron instrucciones." };
    }
    async resetPassword(body) {
        if (!body?.token || !body?.password) {
            throw new common_1.BadRequestException("Token y contraseña son obligatorios");
        }
        return this.authService.resetPassword(body.token, body.password);
    }
    async changePassword(req, body) {
        if (!body?.currentPassword || !body?.newPassword) {
            throw new common_1.BadRequestException("Contraseña actual y nueva contraseña son obligatorias");
        }
        const userId = req.user?.sub || req.user?.userId || req.user?.id;
        return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("refresh"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)("forgot-password"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)("reset-password"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, common_1.Post)("change-password"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map