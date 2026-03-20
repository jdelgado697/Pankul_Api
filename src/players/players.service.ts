import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

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

    const attendanceByPlayer = new Map<
      string,
      { present: number; late: number; absent: number }
    >();

    for (const a of attendance30) {
      const current = attendanceByPlayer.get(a.playerId) || {
        present: 0,
        late: 0,
        absent: 0,
      };

      if (a.status === "PRESENT") current.present += 1;
      else if (a.status === "LATE") current.late += 1;
      else if (a.status === "ABSENT") current.absent += 1;

      attendanceByPlayer.set(a.playerId, current);
    }

    const latestEvalByPlayer = new Map<string, (typeof evaluations)[number]>();

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
      const attendancePct =
        totalSessions30 > 0 ? Math.round((attended / totalSessions30) * 100) : null;

      const latestEval = latestEvalByPlayer.get(player.id) || null;

      const overallAverage = latestEval
        ? Number(
            (
              (
                latestEval.dribbling +
                latestEval.passing +
                latestEval.shooting +
                latestEval.defense +
                latestEval.decisionMaking +
                latestEval.attitude
              ) / 6
            ).toFixed(2)
          )
        : null;

      return {
        ...player,
        attendancePct,
        overallAverage,
        lastEvaluationDate: latestEval?.date ?? null,
      };
    });
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException("Jugadora no encontrada");
    }

    return player;
  }

  async create(data: any) {
    return this.prisma.player.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        birthYear: Number(data.birthYear),
        status: data.status ?? "ACTIVE",
      },
    });
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.player.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException("Jugadora no encontrada");
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

  async remove(id: string) {
    const exists = await this.prisma.player.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException("Jugadora no encontrada");
    }

    return this.prisma.player.delete({
      where: { id },
    });
  }
}