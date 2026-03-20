import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEvaluationDto } from "./dto/create-evaluation.dto";
import { UpdateEvaluationDto } from "./dto/update-evaluation.dto";

@Injectable()
export class EvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEvaluationDto, evaluatorUserId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: dto.playerId },
      select: { id: true, firstName: true, lastName: true, birthYear: true },
    });

    if (!player) {
      throw new NotFoundException("Jugadora no encontrada");
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

async findByPlayer(playerId: string) {
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
    throw new NotFoundException("Jugadora no encontrada");
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
    const overallAverage = Number(
      (
        (
          e.dribbling +
          e.passing +
          e.shooting +
          e.defense +
          e.decisionMaking +
          e.attitude
        ) / 6
      ).toFixed(2)
    );

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

  const averages =
    count > 0
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

  async findOne(id: string) {
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
      throw new NotFoundException("Evaluación no encontrada");
    }

    return {
      ...evaluation,
      overallAverage: this.calcAverage(evaluation),
    };
  }

  async update(id: string, dto: UpdateEvaluationDto) {
    const existing = await this.prisma.evaluation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Evaluación no encontrada");
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

  async remove(id: string) {
    const existing = await this.prisma.evaluation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Evaluación no encontrada");
    }

    await this.prisma.evaluation.delete({
      where: { id },
    });

    return { ok: true };
  }

  private calcAverage(e: {
    dribbling: number;
    passing: number;
    shooting: number;
    defense: number;
    decisionMaking: number;
    attitude: number;
  }) {
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

  private avg(values: number[]) {
    if (!values.length) return 0;
    const total = values.reduce((acc, n) => acc + n, 0);
    return Number((total / values.length).toFixed(2));
  }
}