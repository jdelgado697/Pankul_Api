import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { InvitesService } from "../invites/invites.service";
import { MailService } from "../mail/mail.service";
import * as crypto from "crypto";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parseTtlToMs(ttl: string | undefined, fallbackMs: number): number {
  if (!ttl) return fallbackMs;

  const value = ttl.trim();
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber * 1000 : fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly invites: InvitesService,
    private readonly mailService: MailService
  ) {}

  private async issueTokens(user: {
    id: string;
    email: string;
    role: string;
    fullName?: string | null;
  }) {
    const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
    const refreshTtl = process.env.JWT_REFRESH_TTL || "30d";
    const refreshExpiresAt = new Date(
      Date.now() + parseTtlToMs(refreshTtl, 30 * 24 * 3600 * 1000)
    );

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: mustEnv("JWT_ACCESS_SECRET"),
        expiresIn: accessTtl,
      }
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: mustEnv("JWT_REFRESH_SECRET"),
        expiresIn: refreshTtl,
      }
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName ?? null,
      },
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) throw new UnauthorizedException("Credenciales inválidas");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Credenciales inválidas");

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: any;

    try {
      payload = jwt.verify(refreshToken, mustEnv("JWT_REFRESH_SECRET"));
    } catch {
      throw new UnauthorizedException("Refresh token inválido");
    }

    const userId = payload.sub as string;

    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    const match = await Promise.all(
      tokens.map(async (t) => ({
        token: t,
        ok: await bcrypt.compare(refreshToken, t.tokenHash),
      }))
    );

    const found = match.find((m) => m.ok)?.token;
    if (!found) {
      throw new UnauthorizedException("Refresh token no reconocido");
    }

    await this.prisma.refreshToken.update({
      where: { id: found.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Usuario no encontrado");

    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, mustEnv("JWT_REFRESH_SECRET")) as {
        sub: string;
      };

      const tokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: payload.sub,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      for (const t of tokens) {
        const ok = await bcrypt.compare(refreshToken, t.tokenHash);
        if (ok) {
          await this.prisma.refreshToken.update({
            where: { id: t.id },
            data: { revoked: true },
          });
          break;
        }
      }
    } catch {
      // Respuesta neutra por seguridad.
    }

    return { ok: true };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    await this.mailService.sendPasswordReset(normalizedEmail, token);
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new UnauthorizedException(
        "La nueva contraseña es muy corta (mín. 6)."
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Token inválido o expirado");
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true },
    });

    return { success: true };
  }

  async createUserAsAdmin(data: {
    email: string;
    password: string;
    role: "PARENT" | "COACH" | "DIRECTOR" | "ADMIN";
    fullName?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash,
        role: data.role as any,
        fullName: data.fullName ?? null,
      },
      select: { id: true, email: true, role: true, fullName: true },
    });
  }

  async registerWithInvite(body: {
    email: string;
    password: string;
    fullName: string;
    code: string;
  }) {
    const invite = await this.invites.validateCodeOrThrow(body.code);
    const normalizedEmail = body.email.trim().toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(body.password, 10);
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: "PARENT",
          fullName: body.fullName,
        },
      });
    } else if (user.role !== "PARENT") {
      throw new UnauthorizedException(
        "Este email no puede registrarse como apoderado"
      );
    }

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

    await this.invites.markUsed(invite.id, user.id);

    return this.issueTokens(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    if (!newPassword || newPassword.length < 6) {
      throw new UnauthorizedException(
        "La nueva contraseña es muy corta (mín. 6)."
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Usuario no encontrado");

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Contraseña actual incorrecta");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { ok: true };
  }
}
