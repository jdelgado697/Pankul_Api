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
exports.ExportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function csvEscape(v) {
    const s = String(v ?? "");
    if (/[",\n]/.test(s))
        return `"${s.replace(/"/g, '""')}"`;
    return s;
}
let ExportsService = class ExportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sessionAttendanceCsv(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            select: { id: true, type: true, dateTime: true, notes: true },
        });
        if (!session)
            throw new common_1.NotFoundException("Session not found");
        const players = await this.prisma.player.findMany({
            select: { id: true, firstName: true, lastName: true, birthYear: true },
            orderBy: [{ birthYear: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
        });
        const attendance = await this.prisma.attendance.findMany({
            where: { sessionId },
            select: { playerId: true, status: true },
        });
        const map = new Map(attendance.map((a) => [a.playerId, a.status]));
        const header = [
            "sessionId",
            "dateTime",
            "type",
            "notes",
            "playerId",
            "firstName",
            "lastName",
            "birthYear",
            "status",
        ];
        const lines = [header.map(csvEscape).join(",")];
        for (const p of players) {
            const status = map.get(p.id) || "ABSENT";
            lines.push([
                session.id,
                session.dateTime?.toISOString() ?? "",
                session.type ?? "",
                session.notes ?? "",
                p.id,
                p.firstName,
                p.lastName,
                p.birthYear,
                status,
            ].map(csvEscape).join(","));
        }
        return lines.join("\n");
    }
    async rangeAttendanceCsv(days = 30) {
        const n = Number(days) || 30;
        const now = new Date();
        const from = new Date(now.getTime() - n * 24 * 3600 * 1000);
        const sessions = await this.prisma.session.findMany({
            where: { dateTime: { gte: from, lte: now } },
            select: { id: true, dateTime: true, type: true },
            orderBy: { dateTime: "asc" },
        });
        const players = await this.prisma.player.findMany({
            select: { id: true, firstName: true, lastName: true, birthYear: true },
            orderBy: [{ birthYear: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
        });
        const sessionIds = sessions.map((s) => s.id);
        const attendance = sessionIds.length > 0
            ? await this.prisma.attendance.findMany({
                where: { sessionId: { in: sessionIds } },
                select: { sessionId: true, playerId: true, status: true },
            })
            : [];
        const idx = new Map();
        for (const a of attendance) {
            if (!idx.has(a.playerId))
                idx.set(a.playerId, new Map());
            idx.get(a.playerId).set(a.sessionId, a.status);
        }
        const sessionCols = sessions.map((s) => {
            const d = s.dateTime.toISOString().slice(0, 10);
            return `${d}_${s.type}_${s.id.slice(0, 6)}`;
        });
        const header = ["playerId", "firstName", "lastName", "birthYear", ...sessionCols];
        const lines = [header.map(csvEscape).join(",")];
        for (const p of players) {
            const m = idx.get(p.id) || new Map();
            const row = [
                p.id,
                p.firstName,
                p.lastName,
                p.birthYear,
                ...sessions.map((s) => m.get(s.id) || "ABSENT"),
            ];
            lines.push(row.map(csvEscape).join(","));
        }
        return lines.join("\n");
    }
};
exports.ExportsService = ExportsService;
exports.ExportsService = ExportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportsService);
//# sourceMappingURL=exports.service.js.map