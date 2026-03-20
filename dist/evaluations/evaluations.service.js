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
exports.EvaluationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EvaluationsService = class EvaluationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, evaluatorUserId) {
        const player = await this.prisma.player.findUnique({
            where: { id: dto.playerId },
            select: { id: true, firstName: true, lastName: true, birthYear: true },
        });
        if (!player) {
            throw new common_1.NotFoundException("Jugadora no encontrada");
        }
        const evaluation = await this.prisma.evaluation.create({
            data: {
                playerId: dto.playerId,
                evaluatorUserId,
                dribbling: dto.dribbling,
                passing: dto.passing,
                shooting: dto.shooting,
                defense: dto.defense,
                decisionMaking: dto.decisionMaking,
                attitude: dto.attitude,
                notes: dto.notes ?? null,
            },
            include: {
                player: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        birthYear: true,
                    },
                },
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
        return {
            ...evaluation,
            overallAverage: this.calcAverage(evaluation),
        };
    }
    async findByPlayer(playerId) {
        const player = await this.prisma.player.findUnique({
            where: { id: playerId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                birthYear: true,
            },
        });
        if (!player) {
            throw new common_1.NotFoundException("Jugadora no encontrada");
        }
        const itemsRaw = await this.prisma.evaluation.findMany({
            where: { playerId },
            orderBy: { date: "desc" },
            include: {
                evaluator: {
                    select: {
                        fullName: true,
                        role: true,
                    },
                },
            },
        });
        const items = itemsRaw.map((e) => {
            const overallAverage = Number(((e.dribbling +
                e.passing +
                e.shooting +
                e.defense +
                e.decisionMaking +
                e.attitude) / 6).toFixed(2));
            return {
                id: e.id,
                date: e.date,
                dribbling: e.dribbling,
                passing: e.passing,
                shooting: e.shooting,
                defense: e.defense,
                decisionMaking: e.decisionMaking,
                attitude: e.attitude,
                notes: e.notes,
                overallAverage,
                evaluator: e.evaluator,
            };
        });
        const count = items.length;
        const averages = count > 0
            ? {
                dribbling: Number((items.reduce((a, x) => a + x.dribbling, 0) / count).toFixed(2)),
                passing: Number((items.reduce((a, x) => a + x.passing, 0) / count).toFixed(2)),
                shooting: Number((items.reduce((a, x) => a + x.shooting, 0) / count).toFixed(2)),
                defense: Number((items.reduce((a, x) => a + x.defense, 0) / count).toFixed(2)),
                decisionMaking: Number((items.reduce((a, x) => a + x.decisionMaking, 0) / count).toFixed(2)),
                attitude: Number((items.reduce((a, x) => a + x.attitude, 0) / count).toFixed(2)),
                overall: Number((items.reduce((a, x) => a + x.overallAverage, 0) / count).toFixed(2)),
            }
            : {
                dribbling: 0,
                passing: 0,
                shooting: 0,
                defense: 0,
                decisionMaking: 0,
                attitude: 0,
                overall: 0,
            };
        return {
            player,
            summary: {
                count,
                averages,
            },
            items,
        };
    }
    async findOne(id) {
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id },
            include: {
                player: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        birthYear: true,
                    },
                },
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
        if (!evaluation) {
            throw new common_1.NotFoundException("Evaluación no encontrada");
        }
        return {
            ...evaluation,
            overallAverage: this.calcAverage(evaluation),
        };
    }
    async update(id, dto) {
        const existing = await this.prisma.evaluation.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Evaluación no encontrada");
        }
        const updated = await this.prisma.evaluation.update({
            where: { id },
            data: {
                ...(dto.playerId !== undefined ? { playerId: dto.playerId } : {}),
                ...(dto.dribbling !== undefined ? { dribbling: dto.dribbling } : {}),
                ...(dto.passing !== undefined ? { passing: dto.passing } : {}),
                ...(dto.shooting !== undefined ? { shooting: dto.shooting } : {}),
                ...(dto.defense !== undefined ? { defense: dto.defense } : {}),
                ...(dto.decisionMaking !== undefined
                    ? { decisionMaking: dto.decisionMaking }
                    : {}),
                ...(dto.attitude !== undefined ? { attitude: dto.attitude } : {}),
                ...(dto.notes !== undefined ? { notes: dto.notes ?? null } : {}),
            },
            include: {
                player: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        birthYear: true,
                    },
                },
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
        return {
            ...updated,
            overallAverage: this.calcAverage(updated),
        };
    }
    async remove(id) {
        const existing = await this.prisma.evaluation.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Evaluación no encontrada");
        }
        await this.prisma.evaluation.delete({
            where: { id },
        });
        return { ok: true };
    }
    calcAverage(e) {
        const values = [
            e.dribbling,
            e.passing,
            e.shooting,
            e.defense,
            e.decisionMaking,
            e.attitude,
        ];
        const total = values.reduce((acc, n) => acc + n, 0);
        return Number((total / values.length).toFixed(2));
    }
    avg(values) {
        if (!values.length)
            return 0;
        const total = values.reduce((acc, n) => acc + n, 0);
        return Number((total / values.length).toFixed(2));
    }
};
exports.EvaluationsService = EvaluationsService;
exports.EvaluationsService = EvaluationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EvaluationsService);
//# sourceMappingURL=evaluations.service.js.map