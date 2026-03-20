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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTeamDashboard() {
        const now = new Date();
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        const [players, sessions30, attendance30, evaluations] = await Promise.all([
            this.prisma.player.findMany({
                orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
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
        const totalPlayers = players.length;
        const activePlayers = players.filter((p) => p.status === "ACTIVE").length;
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
        const evaluationsByPlayer = new Map();
        const evalGroups = new Map();
        for (const e of evaluations) {
            const arr = evalGroups.get(e.playerId) || [];
            arr.push(e);
            evalGroups.set(e.playerId, arr);
        }
        for (const [playerId, items] of evalGroups.entries()) {
            const latest = items[0];
            const previous = items[1];
            const calcAvg = (x) => x
                ? Number(((x.dribbling +
                    x.passing +
                    x.shooting +
                    x.defense +
                    x.decisionMaking +
                    x.attitude) / 6).toFixed(2))
                : null;
            evaluationsByPlayer.set(playerId, {
                latestAverage: calcAvg(latest),
                previousAverage: calcAvg(previous),
                latestDate: latest?.date ?? null,
            });
        }
        const playersWithMetrics = players.map((player) => {
            const att = attendanceByPlayer.get(player.id) || {
                present: 0,
                late: 0,
                absent: 0,
            };
            const attended = att.present + att.late;
            const attendancePct = totalSessions30 > 0 ? Math.round((attended / totalSessions30) * 100) : null;
            const evalData = evaluationsByPlayer.get(player.id) || {
                latestAverage: null,
                previousAverage: null,
                latestDate: null,
            };
            const improvement = typeof evalData.latestAverage === "number" &&
                typeof evalData.previousAverage === "number"
                ? Number((evalData.latestAverage - evalData.previousAverage).toFixed(2))
                : null;
            return {
                id: player.id,
                firstName: player.firstName,
                lastName: player.lastName,
                birthYear: player.birthYear,
                status: player.status,
                attendancePct,
                latestAverage: evalData.latestAverage,
                previousAverage: evalData.previousAverage,
                improvement,
                latestEvaluationDate: evalData.latestDate,
                absentCount30: att.absent,
            };
        });
        const attendanceValues = playersWithMetrics
            .map((p) => p.attendancePct)
            .filter((x) => typeof x === "number");
        const teamAttendancePct = attendanceValues.length > 0
            ? Math.round(attendanceValues.reduce((acc, n) => acc + n, 0) / attendanceValues.length)
            : null;
        const averageValues = playersWithMetrics
            .map((p) => p.latestAverage)
            .filter((x) => typeof x === "number");
        const teamAverage = averageValues.length > 0
            ? Number((averageValues.reduce((acc, n) => acc + n, 0) / averageValues.length).toFixed(2))
            : null;
        const alerts = playersWithMetrics
            .flatMap((p) => {
            const arr = [];
            if (typeof p.attendancePct === "number" && p.attendancePct < 60) {
                arr.push(`${p.firstName} ${p.lastName}: asistencia baja (${p.attendancePct}%)`);
            }
            if (p.absentCount30 >= 2) {
                arr.push(`${p.firstName} ${p.lastName}: ${p.absentCount30} ausencias en 30 días`);
            }
            if (p.latestAverage === null) {
                arr.push(`${p.firstName} ${p.lastName}: sin evaluación registrada`);
            }
            else if (p.latestAverage < 3) {
                arr.push(`${p.firstName} ${p.lastName}: promedio bajo (${p.latestAverage})`);
            }
            if (typeof p.improvement === "number" && p.improvement <= -0.5) {
                arr.push(`${p.firstName} ${p.lastName}: bajó ${p.improvement} puntos`);
            }
            return arr;
        })
            .slice(0, 8);
        const topPlayers = playersWithMetrics
            .filter((p) => typeof p.latestAverage === "number")
            .sort((a, b) => (b.latestAverage ?? 0) - (a.latestAverage ?? 0))
            .slice(0, 5);
        const topImprovement = playersWithMetrics
            .filter((p) => typeof p.improvement === "number")
            .sort((a, b) => (b.improvement ?? 0) - (a.improvement ?? 0))
            .slice(0, 5);
        return {
            totalPlayers,
            activePlayers,
            sessionsLast30Days: totalSessions30,
            teamAttendancePct,
            teamAverage,
            alerts,
            topPlayers,
            topImprovement,
        };
    }
    async getPlayerSummary(playerId) {
        const now = new Date();
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        const player = await this.prisma.player.findUnique({
            where: { id: playerId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                birthYear: true,
                status: true,
            },
        });
        if (!player) {
            throw new common_1.NotFoundException("Jugadora no encontrada");
        }
        const sessions30 = await this.prisma.session.findMany({
            where: { dateTime: { gte: from, lte: now } },
            select: { id: true, dateTime: true, type: true },
            orderBy: { dateTime: "desc" },
        });
        const sessionIds = sessions30.map((s) => s.id);
        const attendance30 = sessionIds.length
            ? await this.prisma.attendance.findMany({
                where: { playerId, sessionId: { in: sessionIds } },
                select: { status: true, sessionId: true },
            })
            : [];
        const totalSessions = sessions30.length;
        const present = attendance30.filter((a) => a.status === "PRESENT").length;
        const late = attendance30.filter((a) => a.status === "LATE").length;
        const absent = attendance30.filter((a) => a.status === "ABSENT").length;
        const attended = present + late;
        const attendancePct = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : null;
        const statusBySession = new Map(attendance30.map((a) => [a.sessionId, a.status]));
        const last5 = sessions30.slice(0, 5).map((s) => ({
            dateTime: s.dateTime,
            type: s.type,
            status: statusBySession.get(s.id) || "ABSENT",
        }));
        const alerts = [];
        if (attendancePct !== null && attendancePct < 60) {
            alerts.push("Asistencia baja (< 60%)");
        }
        const lastStatuses = last5.map((x) => x.status);
        for (let i = 0; i < lastStatuses.length - 1; i++) {
            if (lastStatuses[i] === "ABSENT" && lastStatuses[i + 1] === "ABSENT") {
                alerts.push("2 ausencias seguidas");
                break;
            }
        }
        const evals = await this.prisma.evaluation.findMany({
            where: { playerId },
            orderBy: { date: "desc" },
            take: 2,
            include: {
                evaluator: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        const lastEvaluation = evals[0] || null;
        const prevEvaluation = evals[1] || null;
        const fields = [
            "dribbling",
            "passing",
            "shooting",
            "defense",
            "decisionMaking",
            "attitude",
        ];
        const deltas = {};
        if (lastEvaluation && prevEvaluation) {
            fields.forEach((f) => {
                const a = lastEvaluation[f] ?? null;
                const b = prevEvaluation[f] ?? null;
                deltas[f] = a !== null && b !== null ? a - b : null;
            });
        }
        else {
            fields.forEach((f) => {
                deltas[f] = null;
            });
        }
        const pretty = {
            dribbling: "Bote",
            passing: "Pase",
            shooting: "Tiro",
            defense: "Defensa",
            decisionMaking: "Toma de decisiones",
            attitude: "Actitud",
        };
        const fundamentals = fields.map((f) => ({
            key: f,
            label: pretty[f],
            value: lastEvaluation ? lastEvaluation[f] : null,
            delta: deltas[f],
        }));
        const latestOverallAverage = lastEvaluation
            ? Number(((lastEvaluation.dribbling +
                lastEvaluation.passing +
                lastEvaluation.shooting +
                lastEvaluation.defense +
                lastEvaluation.decisionMaking +
                lastEvaluation.attitude) / 6).toFixed(2))
            : null;
        let overallLabel = null;
        if (typeof latestOverallAverage === "number") {
            if (latestOverallAverage >= 4)
                overallLabel = "Destacada";
            else if (latestOverallAverage >= 3)
                overallLabel = "En progreso";
            else
                overallLabel = "Atención";
        }
        const recommendations = [];
        if (lastEvaluation) {
            const scored = fields
                .map((f) => ({ f, v: lastEvaluation[f] }))
                .filter((x) => typeof x.v === "number");
            scored.sort((a, b) => a.v - b.v);
            const focus = scored.slice(0, 2).map((x) => x.f);
            focus.forEach((f) => {
                if (f === "dribbling") {
                    recommendations.push("Bote: 3 series de 45s (mano fuerte y mano débil), sin mirar el balón.");
                }
                else if (f === "passing") {
                    recommendations.push("Pase: 30 pases contra pared (pecho y picado), cuidando precisión.");
                }
                else if (f === "shooting") {
                    recommendations.push("Tiro: 25 lanzamientos cortos con buena técnica y equilibrio antes de alejarse.");
                }
                else if (f === "defense") {
                    recommendations.push("Defensa: 3 series de 20s de desplazamientos laterales (bajo, manos activas).");
                }
                else if (f === "decisionMaking") {
                    recommendations.push("Toma de decisiones: juegos reducidos 1c1 y 2c1 con lectura rápida y pausa antes de actuar.");
                }
                else if (f === "attitude") {
                    recommendations.push("Actitud: reforzar comunicación, esfuerzo constante y respuesta positiva ante correcciones.");
                }
            });
        }
        else {
            recommendations.push("Aún no hay evaluación registrada. El entrenador la agregará pronto.");
        }
        return {
            player,
            attendance30Days: {
                from,
                to: now,
                totalSessions,
                present,
                late,
                absent,
                attendancePct,
                last5,
            },
            evaluation: {
                last: lastEvaluation,
                previous: prevEvaluation,
                deltas,
                fundamentals,
                coachComment: lastEvaluation?.notes ?? null,
                overallAverage: latestOverallAverage,
                overallLabel,
            },
            recommendations,
            alerts,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map