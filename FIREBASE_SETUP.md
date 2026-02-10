# 🔥 Configuración de Firebase Cloud Messaging (FCM)

## ¿Qué es FCM?
Firebase Cloud Messaging es el servicio de Google para enviar notificaciones push. Es el mismo que usan Uber, Rappi, DiDi, etc. **Es 100% GRATIS** y permite enviar notificaciones ilimitadas.

## Paso 1: Crear Proyecto en Firebase

1. Ve a https://console.firebase.google.com/
2. Haz clic en **"Agregar proyecto"**
3. Nombre del proyecto: `deliversyto` (o el que prefieras)
4. Habilitar Google Analytics: **No** (opcional, no necesario para notificaciones)
5. Haz clic en **"Crear proyecto"**

## Paso 2: Configurar Firebase Admin SDK

1. En el menú lateral, ve a **⚙️ Configuración del proyecto**
2. Ve a la pestaña **"Cuentas de servicio"**
3. Selecciona **"Node.js"**
4. Haz clic en **"Generar nueva clave privada"**
5. Se descargará un archivo JSON (por ejemplo: `deliversyto-firebase-adminsdk-abc123.json`)

## Paso 3: Colocar el archivo en tu proyecto

1. Crea una carpeta `config` en la raíz del proyecto (si no existe):
   ```bash
   mkdir config
   ```

2. Copia el archivo JSON descargado a la carpeta `config`:
   ```bash
   config/serviceAccountKey.json
   ```

3. **IMPORTANTE**: Asegúrate de que esta carpeta esté en `.gitignore`:
   ```gitignore
   # Firebase
   /config/serviceAccountKey.json
   ```

## Paso 4: Configurar variable de entorno

Agrega esta línea a tu archivo `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
```

## Paso 5: Reiniciar el servidor

```bash
npm run start:dev
```

Deberías ver este mensaje en los logs:
```
[NotificationsService] Firebase Admin SDK inicializado correctamente
```

## Arquitectura de Notificaciones

### 1. Registro de Dispositivos

Cuando un usuario/driver abre la app por primera vez, la app móvil debe:

1. Pedir permiso para notificaciones
2. Obtener el FCM token del dispositivo
3. Enviarlo al backend

**Ejemplo desde app móvil (React Native + Firebase):**

```javascript
import messaging from '@react-native-firebase/messaging';

// 1. Pedir permiso
await messaging().requestPermission();

// 2. Obtener token
const fcmToken = await messaging().getToken();

// 3. Enviarlo al backend
await fetch('https://api.deliversyto.com/notifications/register-driver-device', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ fcmToken }),
});
```

### 2. Endpoints Disponibles

#### Para Drivers
```http
POST /notifications/register-driver-device
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "fcmToken": "fZ1234567890..."
}
```

#### Para Users
```http
POST /notifications/register-user-device
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "fcmToken": "fZ1234567890..."
}
```

#### Remover Token (Logout)
```http
POST /notifications/unregister-device
Authorization: Bearer {JWT_TOKEN}
```

### 3. Flujo de Notificaciones

#### 🚗 Driver recibe nuevo pedido:
```
User crea pedido → Sistema busca drivers cercanos → Se envía notificación FCM:

┌───────────────────────────────────┐
│ 🚗 DeliverSyto           9:30 AM │
│ Nuevo pedido disponible           │
│ $15,000 - 2.5 km                  │
│ Calle 100 #15-20, Chicó           │
│ [Rechazar]  [Aceptar]             │
└───────────────────────────────────┘
```

#### 👤 User recibe confirmación:
```
Driver acepta → Se calcula tiempo estimado → Se envía notificación FCM:

┌───────────────────────────────────┐
│ ✅ DeliverSyto          9:31 AM  │
│ Repartidor asignado               │
│ Pedro va en camino                │
│ Llegada estimada: 12 min          │
│             [Ver mapa]            │
└───────────────────────────────────┘
```

#### 📦 User recibe actualización:
```
Driver recoge pedido → Notificación FCM:

┌───────────────────────────────────┐
│ 📦 DeliverSyto          9:43 AM  │
│ Pedido recogido                   │
│ Pedro ha recogido tu pedido       │
│ y va en camino                    │
│             [Rastrear]            │
└───────────────────────────────────┘
```

#### 🎉 User recibe confirmación de entrega:
```
Driver entrega → Notificación FCM:

┌───────────────────────────────────┐
│ 🎉 DeliverSyto          10:05 AM │
│ Pedido entregado                  │
│ ¡Tu pedido ha sido entregado!     │
│ ¿Cómo calificarías el servicio?   │
│             [Calificar]           │
└───────────────────────────────────┘
```

## Notificaciones Implementadas

| Evento | Destinatario | Método |
|--------|--------------|--------|
| Nuevo pedido disponible | Driver | `notifyNewOrder()` |
| Driver asignado | User | `notifyDriverAssigned()` |
| Pedido recogido | User | `notifyOrderPickedUp()` |
| Pedido entregado | User | `notifyOrderDelivered()` |
| Pedido cancelado | User/Driver | `notifyOrderCancelled()` |

## Configuración Avanzada (Opcional)

### Prioridad de Notificaciones

Las notificaciones están configuradas con **prioridad alta** para que aparezcan inmediatamente:

- **Android**: `priority: 'high'` + `channelId: 'high_importance_channel'`
- **iOS**: `contentAvailable: true` + `sound: 'default'`

### Sonido y Vibración

Por defecto, todas las notificaciones tienen:
- ✅ Sonido activado
- ✅ Vibración activada
- ✅ Badge (contador rojo en el ícono)

### Datos Adicionales

Cada notificación incluye `data` para que la app móvil pueda:
- Navegar a la pantalla correcta
- Mostrar información del pedido
- Actualizar el estado en tiempo real

## Testing en Dispositivo Real

### 1. Instalar app móvil en teléfono
- Android: APK o Google Play
- iOS: TestFlight o App Store

### 2. Configurar Firebase en la app
```javascript
// firebase.config.js
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "deliversyto.firebaseapp.com",
  projectId: "deliversyto",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abc123",
};
```

### 3. Probar flujo completo
1. Driver abre app → Registra token
2. Driver va online
3. User crea pedido
4. Driver recibe notificación push
5. Driver acepta
6. User recibe notificación

## Troubleshooting

### "Firebase no configurado - notificaciones push deshabilitadas"
- ✅ Verifica que el archivo `serviceAccountKey.json` exista
- ✅ Verifica que la variable `FIREBASE_SERVICE_ACCOUNT_PATH` esté en `.env`
- ✅ Verifica que la ruta sea correcta

### "Error al enviar notificación"
- ✅ Verifica que el token FCM sea válido
- ✅ Verifica que el usuario tenga `pushNotificationsEnabled = true`
- ✅ Verifica los logs del servidor para más detalles

### "Token inválido"
Los tokens FCM pueden expirar o invalidarse si:
- El usuario desinstala la app
- El usuario limpia los datos de la app
- Han pasado más de 60 días sin usar la app

**Solución**: La app debe renovar el token periódicamente.

## Costos

| Servicio | Costo |
|----------|-------|
| Firebase Cloud Messaging | **$0.00 USD** ✅ |
| Notificaciones ilimitadas | **$0.00 USD** ✅ |
| Sin límite de dispositivos | **$0.00 USD** ✅ |

## Comparación con Alternativas

| Servicio | Costo | Comentario |
|----------|-------|------------|
| **FCM (Firebase)** | $0 | ✅ Recomendado - Gratis e ilimitado |
| SMS (Twilio) | $0.01 c/u | ❌ Caro a escala ($100/día con 100 drivers) |
| OneSignal | $0-9/mes | ✅ Alternativa, pero FCM es gratis |
| AWS SNS | $0.50/millón | ✅ Bueno, pero FCM es más fácil |

## Recursos Adicionales

- [Documentación oficial FCM](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Flutter Firebase](https://firebase.flutter.dev/)
- [iOS Setup Guide](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Android Setup Guide](https://firebase.google.com/docs/cloud-messaging/android/client)

---

¿Necesitas ayuda? Revisa los logs del servidor con `npm run start:dev` 🚀
