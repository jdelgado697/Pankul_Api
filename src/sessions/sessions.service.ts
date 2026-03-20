import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  create(body: { dateTime: string; type: any; opponent?: string; location?: string; notes?: string }) {
    return this.prisma.session.create({
      data: {
        dateTime: new Date(body.dateTime),
        type: body.type,
        opponent: body.opponent,
        location: body.location,
        notes: body.notes,
      },
    });
  }

  list() {
    return this.prisma.session.findMany({ orderBy: { dateTime: 'desc' } });
  }

  async attendanceBulk(sessionId: string, items: { playerId: string; status: "PRESENT" | "ABSENT" | "LATE" }[]) {
  if (!items?.length) return { ok: true, count: 0 };

  // OJO: el nombre del modelo puede variar según tu Prisma schema
  // Busca en prisma.schema si tienes: Attendance / SessionAttendance / AttendanceRecord
  // Aquí asumimos "attendance" con campos: sessionId, playerId, status
  const ops = items.map((it) =>
    this.prisma.attendance.upsert({
      where: { sessionId_playerId: { sessionId, playerId: it.playerId } }, // requiere @@unique([sessionId, playerId])
      create: { sessionId, playerId: it.playerId, status: it.status },
      update: { status: it.status },
    })
  );

  await this.prisma.$transaction(ops);
  return { ok: true, count: items.length };
}

  async bulkAttendance(sessionId: string, items: { playerId: string; status: any; note?: string }[]) {
    const ops = items.map(it =>
      this.prisma.attendance.upsert({
        where: { sessionId_playerId: { sessionId, playerId: it.playerId } },
        create: { sessionId, playerId: it.playerId, status: it.status, note: it.note },
        update: { status: it.status, note: it.note },
      })
    );
    await this.prisma.$transaction(ops);
    return { ok: true, count: items.length };
  }
    async update(id: string, data: any) {
    // Validación mínima (evita 500 por body vacío)
    const patch: any = {};

    if (data.type) patch.type = data.type;
    if (data.dateTime) patch.dateTime = new Date(data.dateTime);
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.opponent !== undefined) patch.opponent = data.opponent;
    if (data.location !== undefined) patch.location = data.location;

    if (Object.keys(patch).length === 0) {
      // no hay nada para actualizar
      return this.prisma.session.findUnique({ where: { id } });
    }

    try {
      return await this.prisma.session.update({
        where: { id },
        data: patch,
      });
    } catch (e) {
      // Prisma tira error si no existe
      throw new NotFoundException("Session not found");
    }
  }

  async remove(id: string) {
    try {
      // ⚠️ Hard delete (borra la sesión)
      // Si hay FK de attendance, esto puede fallar si no tienes cascade.
      return await this.prisma.session.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException("Session not found (or has related records)");
    }
  }
}
