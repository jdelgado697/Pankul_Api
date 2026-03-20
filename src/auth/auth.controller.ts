import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";

class LoginDto {
  email!: string;
  password!: string;
}

class RefreshDto {
  refreshToken!: string;
}

class ForgotPasswordDto {
  email!: string;
}

class ResetPasswordDto {
  token!: string;
  password!: string;
}

class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
}

class BootstrapAdminDto {
  email!: string;
  password!: string;
  fullName?: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException("Email y contraseña son obligatorios");
    }

    return this.authService.login(body.email, body.password);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() body: RefreshDto) {
    if (!body?.refreshToken) {
      throw new BadRequestException("refreshToken es obligatorio");
    }

    return this.authService.refresh(body.refreshToken);
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Body() body: RefreshDto) {
    if (!body?.refreshToken) {
      throw new BadRequestException("refreshToken es obligatorio");
    }

    return this.authService.logout(body.refreshToken);
  }

  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    if (!body?.email) {
      throw new BadRequestException("Email es obligatorio");
    }

    await this.authService.forgotPassword(body.email);
    return { message: "Si el correo existe, se enviaron instrucciones." };
  }

  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body() body: ResetPasswordDto) {
    if (!body?.token || !body?.password) {
      throw new BadRequestException("Token y contraseña son obligatorios");
    }

    return this.authService.resetPassword(body.token, body.password);
  }

  @Post("bootstrap-admin")
  @HttpCode(201)
  async bootstrapAdmin(@Body() body: BootstrapAdminDto) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException("Email y contraseña son obligatorios");
    }

    return this.authService.createUserAsAdmin({
      email: body.email,
      password: body.password,
      role: "ADMIN",
      fullName: body.fullName,
    });
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("change-password")
  @HttpCode(200)
  async changePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    if (!body?.currentPassword || !body?.newPassword) {
      throw new BadRequestException(
        "Contraseña actual y nueva contraseña son obligatorias"
      );
    }

    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword
    );
  }
} 