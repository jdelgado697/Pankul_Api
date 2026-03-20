import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ CSV por sesión (una fila por jugadora)
  async sessionAttendanceCsv(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, type: true, dateTime: true, notes: true },
    });

    if (!session) throw new NotFoundException("Session not found");

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

    const lines: string[] = [header.map(csvEscape).join(",")];

    for (const p of players) {
      const status = map.get(p.id) || "ABSENT";

      lines.push(
        [
          session.id,
          session.dateTime?.toISOString() ?? "",
          session.type ?? "",
          session.notes ?? "",
          p.id,
          p.firstName,
          p.lastName,
          p.birthYear,
          status,
        ].map(csvEscape).join(",")
      );
    }

    return lines.join("\n");
  }

  // ✅ CSV últimos N días (matriz): 1 fila por jugadora, 1 columna por sesión
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

    const attendance =
      sessionIds.length > 0
        ? await this.prisma.attendance.findMany({
            where: { sessionId: { in: sessionIds } },
            select: { sessionId: true, playerId: true, status: true },
          })
        : [];

    // index: playerId -> (sessionId -> status)
    const idx = new Map<string, Map<string, string>>();
    for (const a of attendance) {
      if (!idx.has(a.playerId)) idx.set(a.playerId, new Map());
      idx.get(a.playerId)!.set(a.sessionId, a.status);
    }

    // columnas por sesión con etiqueta corta
    const sessionCols = sessions.map((s) => {
      const d = s.dateTime.toISOString().slice(0, 10); // YYYY-MM-DD
      return `${d}_${s.type}_${s.id.slice(0, 6)}`;
    });

    const header = ["playerId", "firstName", "lastName", "birthYear", ...sessionCols];
    const lines: string[] = [header.map(csvEscape).join(",")];

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
}