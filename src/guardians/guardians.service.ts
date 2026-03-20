import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

@Injectable()
export class GuardiansService {
  constructor(private prisma: PrismaService) {}

  private generateInviteCode(length = 8) {
    return randomBytes(length).toString("hex").slice(0, length).toUpperCase();
  }

  async list() {
    const rows = await this.prisma.user.findMany({
      where: { role: "PARENT" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        guardianships: {
          select: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                birthYear: true,
              },
            },
            relation: true,
            canView: true,
          },
        },
      },
      orderBy: [{ fullName: "asc" }],
    });

    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      linkedPlayers: u.guardianships.map((pg) => ({
        id: pg.player.id,
        firstName: pg.player.firstName,
        lastName: pg.player.lastName,
        birthYear: pg.player.birthYear,
        relation: pg.relation,
        canView: pg.canView,
      })),
    }));
  }

  async getOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: "PARENT" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        guardianships: {
          select: {
            playerId: true,
            relation: true,
            canView: true,
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                birthYear: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("Apoderado no encontrado");
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      linkedPlayers: user.guardianships.map((pg) => ({
        id: pg.player.id,
        firstName: pg.player.firstName,
        lastName: pg.player.lastName,
        birthYear: pg.player.birthYear,
        relation: pg.relation,
        canView: pg.canView,
      })),
    };
  }

  async create(body: {
    fullName: string;
    email: string;
    password?: string;
  }) {
    const email = body.email.trim().toLowerCase();

    if (!body.fullName?.trim()) {
      throw new BadRequestException("Nombre requerido");
    }

    if (!email) {
      throw new BadRequestException("Email requerido");
    }

    const exists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (exists) {
      throw new BadRequestException("Ya existe un usuario con ese email");
    }

    const rawPassword = body.password?.trim() || "Pankul1234";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const created = await this.prisma.user.create({
      data: {
        fullName: body.fullName.trim(),
        email,
        role: "PARENT",
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    return {
      ok: true,
      message: "Apoderado creado correctamente",
      temporaryPassword: rawPassword,
      user: created,
    };
  }

  async update(
    id: string,
    body: {
      fullName?: string;
      email?: string;
      password?: string;
    }
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id, role: "PARENT" },
      select: { id: true, email: true },
    });

    if (!existing) {
      throw new NotFoundException("Apoderado no encontrado");
    }

    let normalizedEmail: string | undefined = undefined;
    if (body.email !== undefined) {
      normalizedEmail = body.email.trim().toLowerCase();

      const taken = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id },
        },
        select: { id: true },
      });

      if (taken) {
        throw new BadRequestException("Ese email ya está en uso");
      }
    }

    let passwordHash: string | undefined = undefined;
    if (body.password !== undefined && body.password.trim()) {
      passwordHash = await bcrypt.hash(body.password.trim(), 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(body.fullName !== undefined ? { fullName: body.fullName.trim() } : {}),
        ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
        ...(passwordHash !== undefined ? { passwordHash } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, role: "PARENT" },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Apoderado no encontrado");
    }

    await this.prisma.playerGuardian.deleteMany({
      where: { userId: id },
    });

    await this.prisma.user.delete({
      where: { id },
    });

    return { ok: true, message: "Apoderado eliminado correctamente" };
  }

  async invite(email: string, playerId: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new BadRequestException("Email requerido");
    }

    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, firstName: true, lastName: true, birthYear: true },
    });

    if (!player) {
      throw new NotFoundException("Jugadora no encontrada");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) {
      throw new BadRequestException(
        "Ese email no tiene cuenta. Usa invitación con código."
      );
    }

    if (user.role !== "PARENT") {
      throw new BadRequestException("El usuario existe, pero no tiene rol PARENT");
    }

    const link = await this.prisma.playerGuardian.upsert({
      where: {
        playerId_userId: {
          playerId,
          userId: user.id,
        },
      },
      create: {
        playerId,
        userId: user.id,
        relation: "Apoderado",
        canView: true,
      },
      update: {
        canView: true,
      },
      select: {
        userId: true,
        playerId: true,
        relation: true,
        canView: true,
      },
    });

    return {
      ok: true,
      invited: true,
      linked: true,
      message: "Apoderado vinculado correctamente.",
      user,
      player,
      link,
    };
  }

  async createInvite(body: {
    playerId: string;
    relation?: string;
    canView?: boolean;
    expiresAt?: Date;
  }) {
    const player = await this.prisma.player.findUnique({
      where: { id: body.playerId },
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

    let code = this.generateInviteCode();

    while (await this.prisma.invite.findUnique({ where: { code } })) {
      code = this.generateInviteCode();
    }

    const invite = await this.prisma.invite.create({
      data: {
        code,
        playerId: body.playerId,
        relation: body.relation ?? "Apoderado",
        canView: body.canView ?? true,
        expiresAt: body.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
      select: {
        id: true,
        code: true,
        relation: true,
        canView: true,
        expiresAt: true,
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthYear: true,
          },
        },
      },
    });

    return {
      ok: true,
      message: "Invitación creada correctamente.",
      invite,
    };
  }

  async getInvite(code: string) {
    const normalizedCode = code.trim().toUpperCase();

    const invite = await this.prisma.invite.findUnique({
      where: { code: normalizedCode },
      select: {
        id: true,
        code: true,
        relation: true,
        canView: true,
        expiresAt: true,
        usedAt: true,
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthYear: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException("Invitación no encontrada.");
    }

    if (invite.usedAt) {
      throw new BadRequestException("La invitación ya fue utilizada.");
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException("La invitación ha expirado.");
    }

    return {
      ok: true,
      invite: {
        code: invite.code,
        relation: invite.relation,
        canView: invite.canView,
        expiresAt: invite.expiresAt,
      },
      player: invite.player,
    };
  }

  async acceptInvite(body: {
    code: string;
    fullName: string;
    email: string;
    password: string;
  }) {
    const normalizedCode = body.code.trim().toUpperCase();
    const email = body.email.trim().toLowerCase();
    const fullName = body.fullName.trim();
    const password = body.password.trim();

    if (!normalizedCode) {
      throw new BadRequestException("Código requerido.");
    }

    if (!fullName) {
      throw new BadRequestException("Nombre requerido.");
    }

    if (!email) {
      throw new BadRequestException("Email requerido.");
    }

    if (!password || password.length < 6) {
      throw new BadRequestException("La contraseña debe tener al menos 6 caracteres.");
    }

    const invite = await this.prisma.invite.findUnique({
      where: { code: normalizedCode },
      select: {
        id: true,
        code: true,
        playerId: true,
        relation: true,
        canView: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!invite) {
      throw new NotFoundException("Invitación no encontrada.");
    }

    if (invite.usedAt) {
      throw new BadRequestException("La invitación ya fue utilizada.");
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException("La invitación ha expirado.");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (existingUser && existingUser.role !== "PARENT") {
      throw new BadRequestException("Ese correo ya pertenece a otro tipo de usuario.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName,
            passwordHash,
          },
          select: { id: true, email: true, fullName: true, role: true },
        })
      : await this.prisma.user.create({
          data: {
            fullName,
            email,
            passwordHash,
            role: "PARENT",
          },
          select: { id: true, email: true, fullName: true, role: true },
        });

    await this.prisma.playerGuardian.upsert({
      where: {
        playerId_userId: {
          playerId: invite.playerId,
          userId: user.id,
        },
      },
      create: {
        playerId: invite.playerId,
        userId: user.id,
        relation: invite.relation ?? "Apoderado",
        canView: invite.canView,
      },
      update: {
        relation: invite.relation ?? "Apoderado",
        canView: invite.canView,
      },
    });

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedById: user.id,
      },
    });

    return {
      ok: true,
      message: "Cuenta creada y vínculo aceptado correctamente.",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  link(body: { userId: string; playerId: string; relation?: string; canView?: boolean }) {
    return this.prisma.playerGuardian.upsert({
      where: { playerId_userId: { playerId: body.playerId, userId: body.userId } },
      create: {
        playerId: body.playerId,
        userId: body.userId,
        relation: body.relation ?? null,
        canView: body.canView ?? true,
      },
      update: {
        relation: body.relation ?? null,
        canView: body.canView ?? true,
      },
    });
  }

  async listForPlayer(playerId: string) {
    const rows = await this.prisma.playerGuardian.findMany({
      where: { playerId },
      select: {
        userId: true,
        playerId: true,
        relation: true,
        canView: true,
        user: { select: { id: true, email: true, fullName: true, role: true } },
      },
      orderBy: [{ user: { fullName: "asc" } }],
    });

    return rows.map((r) => ({
      userId: r.userId,
      playerId: r.playerId,
      relation: r.relation,
      canView: r.canView,
      user: r.user,
    }));
  }

  async unlink(userId: string, playerId: string) {
    try {
      await this.prisma.playerGuardian.delete({
        where: { playerId_userId: { playerId, userId } },
      });
      return { ok: true };
    } catch {
      throw new NotFoundException("Vínculo no encontrado");
    }
  }

  async updateLink(
    userId: string,
    playerId: string,
    data: { relation?: string; canView?: boolean }
  ) {
    try {
      return await this.prisma.playerGuardian.update({
        where: { playerId_userId: { playerId, userId } },
        data: {
          ...(data.relation !== undefined ? { relation: data.relation } : {}),
          ...(data.canView !== undefined ? { canView: data.canView } : {}),
        },
        select: { userId: true, playerId: true, relation: true, canView: true },
      });
    } catch {
      throw new NotFoundException("Vínculo no encontrado");
    }
  }
}
