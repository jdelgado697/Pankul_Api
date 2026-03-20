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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCoachDashboard() {
        const now = new Date();
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        const sessions = await this.prisma.session.findMany({
            where: { dateTime: { gte: from, lte: now } },
            select: { id: true, dateTime: true },
            orderBy: { dateTime: "desc" },
        });
        const sessionIds = sessions.map((s) => s.id);
        const players = await this.prisma.player.findMany({
            where: { status: "ACTIVE" },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                birthYear: true,
            },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        });
        const attendances = sessionIds.length
            ? await this.prisma.attendance.findMany({
                where: { sessionId: { in: sessionIds } },
                select: {
                    playerId: true,
                    sessionId: true,
                    status: true,
                },
            })
            : [];
        const evaluations = await this.prisma.evaluation.findMany({
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
                notes: true,
            },
            orderBy: [{ playerId: "asc" }, { date: "desc" }],
        });
        const attendanceByPlayer = new Map();
        for (const a of attendances) {
            const arr = attendanceByPlayer.get(a.playerId) || [];
            arr.push(a);
            attendanceByPlayer.set(a.playerId, arr);
        }
        const evaluationsByPlayer = new Map();
        for (const e of evaluations) {
            const arr = evaluationsByPlayer.get(e.playerId) || [];
            arr.push(e);
            evaluationsByPlayer.set(e.playerId, arr);
        }
        const calcAverage = (e) => {
            const total = e.dribbling +
                e.passing +
                e.shooting +
                e.defense +
                e.decisionMaking +
                e.attitude;
            return Number((total / 6).toFixed(2));
        };
        const getTrafficLight = (average, attendancePct) => {
            if (average === null)
                return "gray";
            if ((average < 2.5) || (attendancePct !== null && attendancePct < 60))
                return "red";
            if ((average < 3.5) || (attendancePct !== null && attendancePct < 75))
                return "yellow";
            return "green";
        };
        const playerStats = players.map((p) => {
            const playerAttendance = attendanceByPlayer.get(p.id) || [];
            const present = playerAttendance.filter((x) => x.status === "PRESENT").length;
            const late = playerAttendance.filter((x) => x.status === "LATE").length;
            const absent = playerAttendance.filter((x) => x.status === "ABSENT").length;
            const attended = present + late;
            const attendancePct = sessions.length > 0 ? Math.round((attended / sessions.length) * 100) : null;
            const playerEvaluations = (evaluationsByPlayer.get(p.id) || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latest = playerEvaluations[0] || null;
            const previous = playerEvaluations[1] || null;
            const latestAverage = latest ? calcAverage(latest) : null;
            const previousAverage = previous ? calcAverage(previous) : null;
            const improvement = latestAverage !== null && previousAverage !== null
                ? Number((latestAverage - previousAverage).toFixed(2))
                : null;
            const trafficLight = getTrafficLight(latestAverage, attendancePct);
            const alerts = [];
            if (attendancePct !== null && attendancePct < 60)
                alerts.push("Asistencia baja");
            if (latestAverage !== null && latestAverage < 2.5)
                alerts.push("Desarrollo técnico bajo");
            if (improvement !== null && improvement < 0)
                alerts.push("Retroceso reciente");
            if (!latest)
                alerts.push("Sin evaluación");
            return {
                player: p,
                attendancePct,
                present,
                late,
                absent,
                latestAverage,
                previousAverage,
                improvement,
                trafficLight,
                alerts,
            };
        });
        const topAttendance = [...playerStats]
            .filter((x) => x.attendancePct !== null)
            .sort((a, b) => (b.attendancePct ?? 0) - (a.attendancePct ?? 0))
            .slice(0, 5)
            .map((x) => ({
            player: x.player,
            attendancePct: x.attendancePct,
            present: x.present,
            late: x.late,
            absent: x.absent,
        }));
        const alertPlayers = [...playerStats]
            .filter((x) => x.alerts.length > 0)
            .sort((a, b) => {
            const aScore = a.trafficLight === "red" ? 3 : a.trafficLight === "yellow" ? 2 : 1;
            const bScore = b.trafficLight === "red" ? 3 : b.trafficLight === "yellow" ? 2 : 1;
            return bScore - aScore;
        })
            .slice(0, 6)
            .map((x) => ({
            player: x.player,
            attendancePct: x.attendancePct,
            alerts: x.alerts,
            trafficLight: x.trafficLight,
            latestAverage: x.latestAverage,
        }));
        const topAverage = [...playerStats]
            .filter((x) => x.latestAverage !== null)
            .sort((a, b) => (b.latestAverage ?? 0) - (a.latestAverage ?? 0))
            .slice(0, 5)
            .map((x) => ({
            player: x.player,
            average: x.latestAverage,
            trafficLight: x.trafficLight,
        }));
        const topImprovement = [...playerStats]
            .filter((x) => x.improvement !== null)
            .sort((a, b) => (b.improvement ?? 0) - (a.improvement ?? 0))
            .slice(0, 5)
            .map((x) => ({
            player: x.player,
            improvement: x.improvement,
            latestAverage: x.latestAverage,
            previousAverage: x.previousAverage,
            trafficLight: x.trafficLight,
        }));
        const developmentAlerts = [...playerStats]
            .filter((x) => x.trafficLight === "red" || x.trafficLight === "yellow")
            .sort((a, b) => {
            const aScore = a.trafficLight === "red" ? 2 : 1;
            const bScore = b.trafficLight === "red" ? 2 : 1;
            return bScore - aScore;
        })
            .slice(0, 8)
            .map((x) => ({
            player: x.player,
            trafficLight: x.trafficLight,
            average: x.latestAverage,
            attendancePct: x.attendancePct,
            alerts: x.alerts,
        }));
        return {
            sessionsCount: sessions.length,
            totalPlayers: players.length,
            latestSessionId: sessions[0]?.id ?? null,
            topAttendance,
            alertPlayers,
            topAverage,
            topImprovement,
            developmentAlerts,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map