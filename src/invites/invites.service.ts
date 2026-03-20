import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "PANKUL-";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  async createInvite(data: {
    playerId: string;
    relation?: string;
    daysValid?: number;
    canView?: boolean;
  }) {
    let code = makeCode();

    while (await this.prisma.invite.findUnique({ where: { code } })) {
      code = makeCode();
    }

    const expiresAt =
      data.daysValid && data.daysValid > 0
        ? new Date(Date.now() + data.daysValid * 24 * 3600 * 1000)
        : null;

    return this.prisma.invite.create({
      data: {
        code,
        playerId: data.playerId,
        relation: data.relation ?? "Apoderado",
        canView: data.canView ?? true,
        expiresAt,
      },
      include: { player: true },
    });
  }

  async validateCodeOrThrow(code: string) {
    const normalized = code.trim().toUpperCase();

    const inv = await this.prisma.invite.findUnique({ where: { code: normalized } });
    if (!inv) throw new BadRequestException("Código inválido");
    if (inv.usedAt) throw new BadRequestException("Código ya usado");
    if (inv.expiresAt && inv.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Código expirado");
    }
    return inv;
  }

  async markUsed(inviteId: string, usedById: string) {
    return this.prisma.invite.update({
      where: { id: inviteId },
      data: { usedAt: new Date(), usedById },
    });
  }
}
