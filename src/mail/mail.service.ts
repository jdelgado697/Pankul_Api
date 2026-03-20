import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"Pankül App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Recuperar contraseña",
      html: `
        <h2>Recuperar contraseña</h2>
        <p>Haz clic en el siguiente enlace:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Este enlace expira en 1 hora.</p>
      `,
    });
  }
}