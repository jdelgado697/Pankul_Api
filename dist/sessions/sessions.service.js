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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SessionsService = class SessionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(body) {
        return this.prisma.session.create({
            data: {
                dateTime: new Date(body.dateTime),
                type: body.type,
                opponent: body.opponent,
                location: body.location,
                notes: body.notes,
            },
        });
    }
    list() {
        return this.prisma.session.findMany({ orderBy: { dateTime: 'desc' } });
    }
    async attendanceBulk(sessionId, items) {
        if (!items?.length)
            return { ok: true, count: 0 };
        const ops = items.map((it) => this.prisma.attendance.upsert({
            where: { sessionId_playerId: { sessionId, playerId: it.playerId } },
            create: { sessionId, playerId: it.playerId, status: it.status },
            update: { status: it.status },
        }));
        await this.prisma.$transaction(ops);
        return { ok: true, count: items.length };
    }
    async bulkAttendance(sessionId, items) {
        const ops = items.map(it => this.prisma.attendance.upsert({
            where: { sessionId_playerId: { sessionId, playerId: it.playerId } },
            create: { sessionId, playerId: it.playerId, status: it.status, note: it.note },
            update: { status: it.status, note: it.note },
        }));
        await this.prisma.$transaction(ops);
        return { ok: true, count: items.length };
    }
    async update(id, data) {
        const patch = {};
        if (data.type)
            patch.type = data.type;
        if (data.dateTime)
            patch.dateTime = new Date(data.dateTime);
        if (data.notes !== undefined)
            patch.notes = data.notes;
        if (data.opponent !== undefined)
            patch.opponent = data.opponent;
        if (data.location !== undefined)
            patch.location = data.location;
        if (Object.keys(patch).length === 0) {
            return this.prisma.session.findUnique({ where: { id } });
        }
        try {
            return await this.prisma.session.update({
                where: { id },
                data: patch,
            });
        }
        catch (e) {
            throw new common_1.NotFoundException("Session not found");
        }
    }
    async remove(id) {
        try {
            return await this.prisma.session.delete({ where: { id } });
        }
        catch (e) {
            throw new common_1.NotFoundException("Session not found (or has related records)");
        }
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map