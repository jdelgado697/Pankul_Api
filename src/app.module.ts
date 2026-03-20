import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { SessionsModule } from './sessions/sessions.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { ReportsModule } from './reports/reports.module';
import { GuardiansModule } from './guardians/guardians.module';
import { MeModule } from './me/me.module';
import { InvitesModule } from "./invites/invites.module";
import { DashboardModule } from './dashboard/dashboard.module';
import { ExportsModule } from './exports/exports.module';

@Module({
  imports: [PrismaModule, AuthModule, PlayersModule, SessionsModule, EvaluationsModule, ReportsModule, GuardiansModule, MeModule, InvitesModule, DashboardModule, ExportsModule],
})
export class AppModule {}

