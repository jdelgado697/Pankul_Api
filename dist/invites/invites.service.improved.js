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
exports.InvitesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "PANKUL-";
    for (let i = 0; i < 5; i++)
        out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}
let InvitesService = class InvitesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createInvite(data) {
        let code = makeCode();
        while (await this.prisma.invite.findUnique({ where: { code } })) {
            code = makeCode();
        }
        const expiresAt = data.daysValid && data.daysValid > 0
            ? new Date(Date.now() + data.daysValid * 24 * 3600 * 1000)
            : null;
        return this.prisma.invite.create({
            data: {
                code,
                playerId: data.playerId,
                relation: data.relation ?? "Apoderado",
                canView: data.canView ?? true,
                expiresAt,
            },
            include: { player: true },
        });
    }
    async validateCodeOrThrow(code) {
        const normalized = code.trim().toUpperCase();
        const inv = await this.prisma.invite.findUnique({ where: { code: normalized } });
        if (!inv)
            throw new common_1.BadRequestException("Código inválido");
        if (inv.usedAt)
            throw new common_1.BadRequestException("Código ya usado");
        if (inv.expiresAt && inv.expiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException("Código expirado");
        }
        return inv;
    }
    async markUsed(inviteId, usedById) {
        return this.prisma.invite.update({
            where: { id: inviteId },
            data: { usedAt: new Date(), usedById },
        });
    }
};
exports.InvitesService = InvitesService;
exports.InvitesService = InvitesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvitesService);
//# sourceMappingURL=invites.service.improved.js.map