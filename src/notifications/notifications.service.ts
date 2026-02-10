import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      // Verificar si Firebase ya está inicializado
      if (admin.apps.length === 0) {
        const serviceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
        
        if (!serviceAccount) {
          this.logger.warn('Firebase no configurado - notificaciones push deshabilitadas');
          return;
        }

        // Inicializar Firebase Admin SDK
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        this.logger.log('Firebase Admin SDK inicializado correctamente');
      } else {
        this.firebaseApp = admin.app();
      }
    } catch (error) {
      this.logger.error('Error al inicializar Firebase Admin SDK', error);
    }
  }

  /**
   * Enviar notificación a un dispositivo específico
   */
  async sendToDevice(
    fcmToken: string,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase no está inicializado - notificación no enviada');
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'high_importance_channel',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Notificación enviada exitosamente: ${response}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error al enviar notificación', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificación a múltiples dispositivos
   */
  async sendToMultipleDevices(
    fcmTokens: string[],
    payload: NotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase no está inicializado - notificaciones no enviadas');
      return { successCount: 0, failureCount: fcmTokens.length };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'high_importance_channel',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      this.logger.log(
        `Notificaciones enviadas: ${response.successCount} exitosas, ${response.failureCount} fallidas`,
      );

      // Log de tokens fallidos
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(`Token fallido: ${fcmTokens[idx]} - ${resp.error?.message}`);
          }
        });
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error('Error al enviar notificaciones múltiples', error);
      return { successCount: 0, failureCount: fcmTokens.length };
    }
  }

  /**
   * Notificación a driver: Nuevo pedido disponible
   */
  async notifyNewOrder(
    fcmToken: string,
    orderId: string,
    amount: number,
    distance: number,
    pickupAddress: string,
  ): Promise<{ success: boolean }> {
    const payload: NotificationPayload = {
      title: '🚗 Nuevo pedido disponible',
      body: `$${amount.toLocaleString('es-CO')} - ${distance.toFixed(1)} km\n${pickupAddress}`,
      data: {
        type: 'new_order',
        orderId: orderId,
        amount: amount.toString(),
        distance: distance.toString(),
      },
    };

    const result = await this.sendToDevice(fcmToken, payload);
    return { success: result.success };
  }

  /**
   * Notificación a user: Driver asignado
   */
  async notifyDriverAssigned(
    fcmToken: string,
    orderId: string,
    driverName: string,
    driverPhoto: string,
    estimatedTime: number,
  ): Promise<{ success: boolean }> {
    const payload: NotificationPayload = {
      title: '✅ Repartidor asignado',
      body: `${driverName} va en camino - Llegada estimada: ${estimatedTime} min`,
      data: {
        type: 'driver_assigned',
        orderId: orderId,
        driverName: driverName,
        estimatedTime: estimatedTime.toString(),
      },
      imageUrl: driverPhoto,
    };

    const result = await this.sendToDevice(fcmToken, payload);
    return { success: result.success };
  }

  /**
   * Notificación a user: Driver recogió el pedido
   */
  async notifyOrderPickedUp(
    fcmToken: string,
    orderId: string,
    driverName: string,
  ): Promise<{ success: boolean }> {
    const payload: NotificationPayload = {
      title: '📦 Pedido recogido',
      body: `${driverName} ha recogido tu pedido y va en camino`,
      data: {
        type: 'order_picked_up',
        orderId: orderId,
      },
    };

    const result = await this.sendToDevice(fcmToken, payload);
    return { success: result.success };
  }

  /**
   * Notificación a user: Pedido entregado
   */
  async notifyOrderDelivered(
    fcmToken: string,
    orderId: string,
  ): Promise<{ success: boolean }> {
    const payload: NotificationPayload = {
      title: '🎉 Pedido entregado',
      body: '¡Tu pedido ha sido entregado! ¿Cómo calificarías el servicio?',
      data: {
        type: 'order_delivered',
        orderId: orderId,
      },
    };

    const result = await this.sendToDevice(fcmToken, payload);
    return { success: result.success };
  }

  /**
   * Notificación: Pedido cancelado
   */
  async notifyOrderCancelled(
    fcmToken: string,
    orderId: string,
    reason: string,
  ): Promise<{ success: boolean }> {
    const payload: NotificationPayload = {
      title: '❌ Pedido cancelado',
      body: `Razón: ${reason}`,
      data: {
        type: 'order_cancelled',
        orderId: orderId,
        reason: reason,
      },
    };

    const result = await this.sendToDevice(fcmToken, payload);
    return { success: result.success };
  }

  /**
   * Validar si un token FCM es válido
   */
  async validateToken(fcmToken: string): Promise<boolean> {
    if (!this.firebaseApp) {
      return false;
    }

    try {
      // Enviar mensaje de prueba silencioso
      await admin.messaging().send({
        token: fcmToken,
        data: { type: 'validation' },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
        android: {
          priority: 'high',
        },
      });
      return true;
    } catch (error) {
      this.logger.warn(`Token FCM inválido: ${error.message}`);
      return false;
    }
  }
}
