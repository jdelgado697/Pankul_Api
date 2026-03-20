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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const invites_service_1 = require("../invites/invites.service");
const mail_service_1 = require("../mail/mail.service");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
function mustEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing env var: ${name}`);
    return v;
}
function parseTtlToMs(ttl, fallbackMs) {
    if (!ttl)
        return fallbackMs;
    const value = ttl.trim();
    const match = value.match(/^(\d+)([smhd])$/i);
    if (!match) {
        const asNumber = Number(value);
        return Number.isFinite(asNumber) ? asNumber * 1000 : fallbackMs;
    }
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case "s":
            return amount * 1000;
        case "m":
            return amount * 60 * 1000;
        case "h":
            return amount * 60 * 60 * 1000;
        case "d":
            return amount * 24 * 60 * 60 * 1000;
        default:
            return fallbackMs;
    }
}
let AuthService = class AuthService {
    constructor(prisma, jwtService, invites, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.invites = invites;
        this.mailService = mailService;
    }
    async issueTokens(user) {
        const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
        const refreshTtl = process.env.JWT_REFRESH_TTL || "30d";
        const refreshExpiresAt = new Date(Date.now() + parseTtlToMs(refreshTtl, 30 * 24 * 3600 * 1000));
        const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role }, {
            secret: mustEnv("JWT_ACCESS_SECRET"),
            expiresIn: accessTtl,
        });
        const refreshToken = await this.jwtService.signAsync({ sub: user.id }, {
            secret: mustEnv("JWT_REFRESH_SECRET"),
            expiresIn: refreshTtl,
        });
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: refreshExpiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName ?? null,
            },
        };
    }
    async login(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user)
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        return this.issueTokens(user);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = jwt.verify(refreshToken, mustEnv("JWT_REFRESH_SECRET"));
        }
        catch {
            throw new common_1.UnauthorizedException("Refresh token inválido");
        }
        const userId = payload.sub;
        const tokens = await this.prisma.refreshToken.findMany({
            where: {
                userId,
                revoked: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });
        const match = await Promise.all(tokens.map(async (t) => ({
            token: t,
            ok: await bcrypt.compare(refreshToken, t.tokenHash),
        })));
        const found = match.find((m) => m.ok)?.token;
        if (!found) {
            throw new common_1.UnauthorizedException("Refresh token no reconocido");
        }
        await this.prisma.refreshToken.update({
            where: { id: found.id },
            data: { revoked: true },
        });
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException("Usuario no encontrado");
        return this.issueTokens(user);
    }
    async logout(refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, mustEnv("JWT_REFRESH_SECRET"));
            const tokens = await this.prisma.refreshToken.findMany({
                where: {
                    userId: payload.sub,
                    revoked: false,
                    expiresAt: { gt: new Date() },
                },
            });
            for (const t of tokens) {
                const ok = await bcrypt.compare(refreshToken, t.tokenHash);
                if (ok) {
                    await this.prisma.refreshToken.update({
                        where: { id: t.id },
                        data: { revoked: true },
                    });
                    break;
                }
            }
        }
        catch {
        }
        return { ok: true };
    }
    async forgotPassword(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user)
            return;
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.user.update({
            where: { email: normalizedEmail },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry,
            },
        });
        await this.mailService.sendPasswordReset(normalizedEmail, token);
    }
    async resetPassword(token, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            throw new common_1.UnauthorizedException("La nueva contraseña es muy corta (mín. 6).");
        }
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("Token inválido o expirado");
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashed,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        await this.prisma.refreshToken.updateMany({
            where: { userId: user.id, revoked: false },
            data: { revoked: true },
        });
        return { success: true };
    }
    async createUserAsAdmin(data) {
        const passwordHash = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email.trim().toLowerCase(),
                passwordHash,
                role: data.role,
                fullName: data.fullName ?? null,
            },
            select: { id: true, email: true, role: true, fullName: true },
        });
    }
    async registerWithInvite(body) {
        const invite = await this.invites.validateCodeOrThrow(body.code);
        const normalizedEmail = body.email.trim().toLowerCase();
        let user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            const passwordHash = await bcrypt.hash(body.password, 10);
            user = await this.prisma.user.create({
                data: {
                    email: normalizedEmail,
                    passwordHash,
                    role: "PARENT",
                    fullName: body.fullName,
                },
            });
        }
        else if (user.role !== "PARENT") {
            throw new common_1.UnauthorizedException("Este email no puede registrarse como apoderado");
        }
        await this.prisma.playerGuardian.upsert({
            where: {
                playerId_userId: {
                    playerId: invite.playerId,
                    userId: user.id,
                },
            },
            create: {
                playerId: invite.playerId,
                userId: user.id,
                relation: invite.relation ?? "Apoderado",
                canView: invite.canView,
            },
            update: {
                relation: invite.relation ?? "Apoderado",
                canView: invite.canView,
            },
        });
        await this.invites.markUsed(invite.id, user.id);
        return this.issueTokens(user);
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            throw new common_1.UnauthorizedException("La nueva contraseña es muy corta (mín. 6).");
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException("Usuario no encontrado");
        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException("Contraseña actual incorrecta");
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        await this.prisma.refreshToken.updateMany({
            where: { userId, revoked: false },
            data: { revoked: true },
        });
        return { ok: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        invites_service_1.InvitesService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map