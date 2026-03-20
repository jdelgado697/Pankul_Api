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
exports.MeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MeService = class MeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async players(userId) {
        const links = await this.prisma.playerGuardian.findMany({
            where: { userId, canView: true },
            include: {
                player: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        birthYear: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                player: {
                    lastName: "asc",
                },
            },
        });
        return links.map((x) => x.player);
    }
    async profile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                guardianships: {
                    where: { canView: true },
                    include: {
                        player: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                birthYear: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException("Usuario no encontrado");
        }
        const clubName = process.env.CLUB_NAME || "Club Pankül Loncoche";
        const linkedPlayers = user.guardianships.map((g) => g.player);
        const linkedPlayerIds = linkedPlayers.map((p) => p.id);
        const now = new Date();
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        let lastAttendance = null;
        let attendancePctMonth = null;
        if (linkedPlayerIds.length > 0) {
            const [attendanceItems, sessions30] = await Promise.all([
                this.prisma.attendance.findMany({
                    where: {
                        playerId: { in: linkedPlayerIds },
                    },
                    include: {
                        player: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                        session: {
                            select: {
                                dateTime: true,
                                type: true,
                            },
                        },
                    },
                    orderBy: {
                        session: {
                            dateTime: "desc",
                        },
                    },
                    take: 1,
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
            ]);
            if (attendanceItems.length > 0) {
                const a = attendanceItems[0];
                lastAttendance = {
                    playerName: `${a.player.firstName} ${a.player.lastName}`,
                    dateTime: a.session.dateTime,
                    status: a.status,
                    type: a.session.type,
                };
            }
            const sessionIds30 = sessions30.map((s) => s.id);
            if (sessionIds30.length > 0) {
                const attendance30 = await this.prisma.attendance.findMany({
                    where: {
                        playerId: { in: linkedPlayerIds },
                        sessionId: { in: sessionIds30 },
                    },
                    select: {
                        status: true,
                    },
                });
                const present = attendance30.filter((a) => a.status === "PRESENT").length;
                const late = attendance30.filter((a) => a.status === "LATE").length;
                const totalPossible = sessionIds30.length * linkedPlayerIds.length;
                attendancePctMonth =
                    totalPossible > 0
                        ? Math.round(((present + late) / totalPossible) * 100)
                        : null;
            }
        }
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            clubName,
            linkedPlayersCount: linkedPlayers.length,
            linkedPlayers,
            lastAttendance,
            attendancePctMonth,
        };
    }
};
exports.MeService = MeService;
exports.MeService = MeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeService);
//# sourceMappingURL=me.service.js.map