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
exports.PlayersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PlayersService = class PlayersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const now = new Date();
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        const [players, sessions30, attendance30, evaluations] = await Promise.all([
            this.prisma.player.findMany({
                orderBy: [{ birthYear: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
            }),
            this.prisma.session.findMany({
                where: {
                    dateTime: {
                        gte: from,
                        lte: now,
                    },
                },
                select: {
                    id: true,
                },
            }),
            this.prisma.attendance.findMany({
                where: {
                    session: {
                        dateTime: {
                            gte: from,
                            lte: now,
                        },
                    },
                },
                select: {
                    playerId: true,
                    status: true,
                },
            }),
            this.prisma.evaluation.findMany({
                orderBy: [{ playerId: "asc" }, { date: "desc" }],
                select: {
                    id: true,
                    playerId: true,
                    date: true,
                    dribbling: true,
                    passing: true,
                    shooting: true,
                    defense: true,
                    decisionMaking: true,
                    attitude: true,
                },
            }),
        ]);
        const totalSessions30 = sessions30.length;
        const attendanceByPlayer = new Map();
        for (const a of attendance30) {
            const current = attendanceByPlayer.get(a.playerId) || {
                present: 0,
                late: 0,
                absent: 0,
            };
            if (a.status === "PRESENT")
                current.present += 1;
            else if (a.status === "LATE")
                current.late += 1;
            else if (a.status === "ABSENT")
                current.absent += 1;
            attendanceByPlayer.set(a.playerId, current);
        }
        const latestEvalByPlayer = new Map();
        for (const e of evaluations) {
            if (!latestEvalByPlayer.has(e.playerId)) {
                latestEvalByPlayer.set(e.playerId, e);
            }
        }
        return players.map((player) => {
            const att = attendanceByPlayer.get(player.id) || {
                present: 0,
                late: 0,
                absent: 0,
            };
            const attended = att.present + att.late;
            const attendancePct = totalSessions30 > 0 ? Math.round((attended / totalSessions30) * 100) : null;
            const latestEval = latestEvalByPlayer.get(player.id) || null;
            const overallAverage = latestEval
                ? Number(((latestEval.dribbling +
                    latestEval.passing +
                    latestEval.shooting +
                    latestEval.defense +
                    latestEval.decisionMaking +
                    latestEval.attitude) / 6).toFixed(2))
                : null;
            return {
                ...player,
                attendancePct,
                overallAverage,
                lastEvaluationDate: latestEval?.date ?? null,
            };
        });
    }
    async findOne(id) {
        const player = await this.prisma.player.findUnique({
            where: { id },
        });
        if (!player) {
            throw new common_1.NotFoundException("Jugadora no encontrada");
        }
        return player;
    }
    async create(data) {
        return this.prisma.player.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                birthYear: Number(data.birthYear),
                status: data.status ?? "ACTIVE",
            },
        });
    }
    async update(id, data) {
        const exists = await this.prisma.player.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException("Jugadora no encontrada");
        }
        return this.prisma.player.update({
            where: { id },
            data: {
                ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
                ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
                ...(data.birthYear !== undefined
                    ? { birthYear: Number(data.birthYear) }
                    : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
            },
        });
    }
    async remove(id) {
        const exists = await this.prisma.player.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException("Jugadora no encontrada");
        }
        return this.prisma.player.delete({
            where: { id },
        });
    }
};
exports.PlayersService = PlayersService;
exports.PlayersService = PlayersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlayersService);
//# sourceMappingURL=players.service.js.map