import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async players(userId: string) {
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

  async profile(userId: string) {
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
      throw new NotFoundException("Usuario no encontrado");
    }

    const clubName = process.env.CLUB_NAME || "Club Pankül Loncoche";

    const linkedPlayers = user.guardianships.map((g) => g.player);
    const linkedPlayerIds = linkedPlayers.map((p) => p.id);

    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    let lastAttendance: {
      playerName: string;
      dateTime: Date;
      status: string;
      type: string;
    } | null = null;

    let attendancePctMonth: number | null = null;

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
}