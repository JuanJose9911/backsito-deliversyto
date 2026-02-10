# Carpeta de Configuración

Esta carpeta contiene archivos de configuración sensibles que no deben subirse a Git.

## Archivos requeridos:

### 1. serviceAccountKey.json (Firebase Cloud Messaging)

Este archivo contiene las credenciales para enviar notificaciones push con Firebase.

**Cómo obtenerlo:**
1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto (o créalo si no tienes uno)
3. Ve a **Configuración del proyecto** → **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Guarda el archivo como `serviceAccountKey.json` en esta carpeta

**Estructura esperada:**
```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**IMPORTANTE**: 
- ⚠️ **NO** subas este archivo a Git
- ⚠️ **NO** compartas este archivo públicamente
- ✅ El archivo ya está en `.gitignore`

## Variables de entorno

Asegúrate de tener esta variable en tu archivo `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
```

## Documentación completa

Ver [FIREBASE_SETUP.md](../FIREBASE_SETUP.md) para instrucciones detalladas.
