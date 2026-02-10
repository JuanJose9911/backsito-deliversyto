import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio;
  private fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (accountSid && authToken) {
      this.twilioClient = twilio.default(accountSid, authToken);
      this.logger.log('✅ Twilio client initialized');
    } else {
      this.logger.warn('⚠️ Twilio credentials not configured. SMS sending will be simulated.');
    }
  }

  /**
   * Enviar código de verificación por SMS
   */
  async sendVerificationCode(phone: string, code: string): Promise<void> {
    const message = `Tu código de verificación es: ${code}. Válido por 10 minutos.`;

    try {
      if (!this.twilioClient) {
        // Modo desarrollo sin Twilio configurado
        this.logger.log(`📱 [SIMULADO] SMS a ${phone}: ${message}`);
        return;
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: phone,
      });

      this.logger.log(`✅ SMS enviado exitosamente a ${phone}. SID: ${result.sid}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando SMS a ${phone}:`, error);
      throw new Error(`No se pudo enviar el SMS: ${error.message}`);
    }
  }

  /**
   * Enviar mensaje SMS personalizado
   */
  async sendSms(phone: string, message: string): Promise<void> {
    try {
      if (!this.twilioClient) {
        this.logger.log(`📱 [SIMULADO] SMS a ${phone}: ${message}`);
        return;
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: phone,
      });

      this.logger.log(`✅ SMS enviado exitosamente a ${phone}. SID: ${result.sid}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando SMS a ${phone}:`, error);
      throw new Error(`No se pudo enviar el SMS: ${error.message}`);
    }
  }
}
