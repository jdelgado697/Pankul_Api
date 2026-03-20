import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { InvitesModule } from "../invites/invites.module";
import { MailService } from "../mail/mail.service";

@Module({
  imports: [
    PrismaModule,
    InvitesModule,
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
        signOptions: { expiresIn: process.env.JWT_ACCESS_TTL || "15m" },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, MailService],
  controllers: [AuthController],
})
export class AuthModule {}