import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.get<string>('app.resendApiKey'),
    );
    this.from = this.configService.get<string>('app.resendFrom') as string;
  }

  // Carga el template HTML y reemplaza los placeholders
  private loadTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    const templatePath = path.join(
      __dirname,
      'templates',
      `${templateName}.html`,
    );

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Reemplaza cada {{variable}} con su valor
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replaceAll(`{{${key}}}`, value);
    });

    return html;
  }

  async sendWelcome(
    email: string,
    fullName: string,
    institutionName: string,
  ): Promise<void> {
    const firstName = fullName.split(' ')[0];

    const html = this.loadTemplate('welcome', {
      firstName,
      institutionName,
    });

    try {
      await this.resend.emails.send({
        from: this.from,
        to: 'yandres2021@gmail.com',
        subject: `Bienvenido a ${institutionName} en Klasy`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Error enviando correo de bienvenida a ${email}`,
        error,
      );
    }
  }

}