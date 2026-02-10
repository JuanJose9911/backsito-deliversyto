# 🧪 Guía de Testing con Postman - DeliverSyto

## 📦 Importar Colección

1. **Abrir Postman**
2. **Import** → Seleccionar archivo: `DeliverSyto.postman_collection.json`
3. La colección aparecerá en el sidebar izquierdo

---

## 🚀 FLUJO COMPLETO DE TESTING

### **PASO 1: Iniciar el servidor**

```bash
npm run start:dev
```

Verifica que veas:
```
Application is running on: http://localhost:3000
[NotificationsService] Firebase Admin SDK inicializado correctamente
```

---

### **PASO 2: Ejecutar requests en orden**

#### **1️⃣ REGISTRO Y AUTENTICACIÓN**

**1.1) Registro de Usuario**
```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "test.user@deliversyto.com",
  "password": "123456",
  "name": "Juan Test",
  "phone": "+573001234567"
}
```

**✅ Respuesta esperada:**
```json
{
  "message": "Usuario registrado. Verifica tu código para activar tu cuenta.",
  "userId": "uuid-generado",
  "email": "test.user@deliversyto.com"
}
```

**⚠️ IMPORTANTE:** El usuario se crea con `isVerified: false`. Necesitas verificar el código antes de poder hacer login.

---

**1.2) Verificar Código de Usuario**

**Obtener el código de verificación:**
```sql
SELECT code, expiresAt FROM verification_codes 
WHERE userId = 'uuid-del-usuario' 
AND type = 'registration' 
AND isUsed = false 
ORDER BY createdAt DESC 
LIMIT 1;
```

O espera el SMS con el código de 6 dígitos.

```http
POST http://localhost:3000/auth/verify
Content-Type: application/json

{
  "userId": "{{userId}}",
  "code": "123456"
}
```

**✅ Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "test.user@deliversyto.com",
    "name": "Juan Test",
    "phone": "+573001234567"
  }
}
```

**⚠️ NOTA:** Este endpoint hace login automáticamente después de verificar el código. El token se guarda automáticamente en la variable `{{userToken}}`.

---

**1.3) Login de Usuario**
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "test.user@deliversyto.com",
  "password": "123456"
}
```

**✅ Respuesta esperada (solo si ya verificaste el código):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "test.user@deliversyto.com",
    "name": "Juan Test",
    "phone": "+573001234567"
  }
}
```

**❌ Error esperado si NO has verificado:**
```json
{
  "statusCode": 401,
  "message": "Debes verificar tu email antes de iniciar sesión. Revisa el código que te enviamos por SMS.",
  "error": "Unauthorized"
}
```

---

**1.4) Registro de Driver**
```http
POST http://localhost:3000/drivers/register
Content-Type: application/json

{
  "name": "Pedro Conductor Test",
  "email": "driver.test@deliversyto.com",
  "password": "123456",
  "phone": "+573101234567",
  "photo": "https://example.com/photo.jpg",
  "birthDate": "1990-05-15",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "emergencyContactName": "Maria Conductor",
  "emergencyContactPhone": "+573109876543",
  "emergencyContactRelationship": "Esposa",
  "vehicle": {
    "type": "motorcycle",
    "plate": "ABC123",
    "brand": "Honda",
    "model": "CBR 150",
    "year": 2020,
    "color": "Roja",
    "registrationPhoto": "https://example.com/registration.jpg",
    "soatPhoto": "https://example.com/soat.jpg",
    "soatExpiryDate": "2026-12-31",
    "technicalReviewPhoto": "https://example.com/technical.jpg",
    "technicalReviewExpiryDate": "2026-12-31"
  },
  "documents": [
    {
      "type": "license",
      "documentNumber": "L123456789",
      "photoUrl": "https://example.com/license.jpg",
      "issueDate": "2020-01-01",
      "expiryDate": "2030-01-01"
    }
  ]
}
```

**✅ Respuesta esperada:**
```json
{
  "id": "driver-uuid",
  "name": "Pedro Conductor Test",
  "email": "driver.test@deliversyto.com",
  "verificationStatus": "pending",
  "isActive": false
}
```

**⚠️ NOTA:** El driver estará en status `pending`. Para poder trabajar, necesitas:

1. **Opción A:** Actualizar manualmente en la base de datos:
```sql
UPDATE drivers 
SET verificationStatus = 'approved', isActive = true 
WHERE email = 'driver.test@deliversyto.com';
```

2. **Opción B:** Usar uno de los drivers del seed:
- Email: `repartidor1@test.com`
- Password: `123456`
- Status: `approved` y `online`

---

**1.5) Login de Driver**
```http
POST http://localhost:3000/auth/driver/login
Content-Type: application/json

{
  "email": "repartidor1@test.com",
  "password": "123456"
}
```

**✅ Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": "driver-uuid",
    "email": "repartidor1@test.com",
    "name": "Pedro Conductor"
  }
}
```

---

#### **2️⃣ CREAR DIRECCIONES**

**2.1) Crear Dirección Origen**
```http
POST http://localhost:3000/addresses
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json

{
  "latitude": 4.6869,
  "longitude": -74.0543,
  "formattedAddress": "Calle 100 #15-20, Bogotá",
  "city": "Bogotá",
  "state": "Cundinamarca",
  "country": "Colombia",
  "placeId": "ChIJ0T2NLikpFY4Rxb9iKgznGNA_test_origin",
  "label": "home",
  "alias": "Casa",
  "instructions": "Torre A, Apartamento 501"
}
```

**✅ Respuesta esperada:**
```json
{
  "id": "address-uuid-1",
  "formattedAddress": "Calle 100 #15-20, Bogotá",
  "label": "home"
}
```

**⚠️ Guarda el `id` como `originAddressId`**

---

**2.2) Crear Dirección Destino**
```http
POST http://localhost:3000/addresses
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json

{
  "latitude": 4.6097,
  "longitude": -74.0817,
  "formattedAddress": "Carrera 7 #32-16, Bogotá",
  "city": "Bogotá",
  "state": "Cundinamarca",
  "country": "Colombia",
  "placeId": "ChIJabcdef123456789xyz1234_test_destination",
  "label": "work",
  "alias": "Oficina",
  "instructions": "Piso 3, Recepción"
}
```

**⚠️ Guarda el `id` como `destinationAddressId`**

---

#### **3️⃣ PREPARAR DRIVER**

**3.1) Driver - Actualizar Ubicación GPS**
```http
PATCH http://localhost:3000/drivers/location
Authorization: Bearer {DRIVER_TOKEN}
Content-Type: application/json

{
  "latitude": 4.6795,
  "longitude": -74.0489
}
```

**✅ Respuesta esperada:**
```json
{
  "success": true
}
```

**📍 Ubicación:** A ~1.5km del origen (Calle 100)

---

**3.2) Driver - Cambiar a Online**
```http
PATCH http://localhost:3000/drivers/{DRIVER_ID}/status
Authorization: Bearer {DRIVER_TOKEN}
Content-Type: application/json

{
  "status": "online",
  "isAvailable": true
}
```

**✅ Respuesta esperada:**
```json
{
  "id": "driver-uuid",
  "status": "online",
  "isAvailable": true
}
```

**🟢 Driver ahora está listo para recibir pedidos**

---

#### **4️⃣ CREAR Y ASIGNAR PEDIDO**

**4.1) Usuario - Crear Pedido**
```http
POST http://localhost:3000/orders
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json

{
  "originLatitude": 4.6869,
  "originLongitude": -74.0543,
  "originAddress": "Calle 100 #15-20, Bogotá",
  "originDetails": "Torre A, Apartamento 501",
  "destinationLatitude": 4.6097,
  "destinationLongitude": -74.0817,
  "destinationAddress": "Carrera 7 #32-16, Bogotá",
  "destinationDetails": "Piso 3, Recepción",
  "vehicleType": "motorcycle",
  "notes": "Documentos importantes"
}
```

**✅ Respuesta esperada:**
```json
{
  "id": "order-uuid",
  "status": "pending",
  "distanceKm": 9.24,
  "estimatedDurationMinutes": 28,
  "basePrice": 4000,
  "distanceFee": 9240,
  "serviceFee": 663,
  "total": 13903
}
```

**⚠️ Guarda el `id` como `orderId`**

---

**4.2) Usuario - Asignar Drivers al Pedido**
```http
POST http://localhost:3000/orders/{ORDER_ID}/assign
Authorization: Bearer {USER_TOKEN}
```

**✅ Respuesta esperada:**
```json
{
  "notifiedDrivers": 1,
  "drivers": [
    {
      "id": "driver-uuid",
      "name": "Pedro Conductor",
      "distance": 1.45
    }
  ]
}
```

**🔔 ¡AQUÍ SE ENVÍA LA NOTIFICACIÓN PUSH FCM AL DRIVER!**

**📱 Logs del servidor:**
```
[OrderAssignmentService] 📲 Notificando a 1 drivers:
   - Pedro Conductor (1.45km de distancia)
   ✅ Notificación push enviada a Pedro Conductor
[OrderAssignmentService] 📝 Estado actualizado: pending → searching_driver
```

---

**4.3) Driver - Ver Pedido**
```http
GET http://localhost:3000/orders/{ORDER_ID}
Authorization: Bearer {DRIVER_TOKEN}
```

**✅ Respuesta esperada:**
```json
{
  "id": "order-uuid",
  "status": "searching_driver",
  "total": 15903,
  "originFormattedAddress": "Calle 100 #15-20, Bogotá",
  "destinationFormattedAddress": "Carrera 7 #32-16, Bogotá",
  "distanceKm": 9.24
}
```

---

**4.4) Driver - Aceptar Pedido**
```http
POST http://localhost:3000/orders/{ORDER_ID}/accept
Authorization: Bearer {DRIVER_TOKEN}
```

**✅ Respuesta esperada:**
```json
{
  "id": "order-uuid",
  "status": "driver_assigned",
  "driverId": "driver-uuid",
  "assignedAt": "2026-02-09T..."
}
```

**🔔 ¡AQUÍ SE ENVÍA LA NOTIFICACIÓN PUSH FCM AL USUARIO!**

**📱 Logs del servidor:**
```
[OrderAssignmentService] ✅ Pedido asignado a driver Pedro Conductor
[OrderAssignmentService] 📲 Notificación de asignación enviada al usuario
[OrderAssignmentService] 📝 Estado actualizado: searching_driver → driver_assigned
```

---

#### **5️⃣ CICLO DE VIDA DEL PEDIDO**

**5.1) Driver - Iniciar Recogida**
```http
POST http://localhost:3000/orders/{ORDER_ID}/start-pickup
Authorization: Bearer {DRIVER_TOKEN}
```

**✅ Estado:** `driver_assigned` → `picking_up`

---

**5.2) Driver - Confirmar Recogida**
```http
POST http://localhost:3000/orders/{ORDER_ID}/confirm-pickup
Authorization: Bearer {DRIVER_TOKEN}
```

**✅ Estado:** `picking_up` → `picked_up`

**🔔 ¡NOTIFICACIÓN PUSH AL USUARIO: "Pedido recogido"!**

**📱 Logs del servidor:**
```
[OrdersService] 📝 Estado actualizado: picking_up → picked_up
[OrdersService] 📲 Notificación de recogida enviada al usuario
```

---

**5.3) Driver - Iniciar Entrega**
```http
POST http://localhost:3000/orders/{ORDER_ID}/start-delivery
Authorization: Bearer {DRIVER_TOKEN}
```

**✅ Estado:** `picked_up` → `in_transit`

---

**5.4) Driver - Completar Entrega**
```http
POST http://localhost:3000/orders/{ORDER_ID}/complete
Authorization: Bearer {DRIVER_TOKEN}
```

**✅ Respuesta esperada:**
```json
{
  "id": "order-uuid",
  "status": "delivered"
}
```

**🔔 ¡NOTIFICACIÓN PUSH AL USUARIO: "Pedido entregado"!**

**📱 Logs del servidor:**
```
[OrdersService] 📝 Estado actualizado: in_transit → delivered
[OrdersService] 💰 Driver liberado y ganancia actualizada
[OrdersService] 📲 Notificación de entrega enviada al usuario
```

**💰 Cálculo de ganancia:**
- Distancia Fee: $9,240 × 70% = $6,468
- Propina: $2,000 × 100% = $2,000
- **Total ganancia driver: $8,468**

---

## 📊 VERIFICACIÓN DE RESULTADOS

### **Estado Final del Pedido:**
```http
GET http://localhost:3000/orders/{ORDER_ID}
Authorization: Bearer {USER_TOKEN}
```

**✅ Debe mostrar:**
- Status: `delivered`
- Driver asignado
- Todas las fechas registradas
- Total pagado

### **Estado Final del Driver:**
```http
GET http://localhost:3000/drivers/me
Authorization: Bearer {DRIVER_TOKEN}
```

**✅ Debe mostrar:**
- Status: `online` (liberado)
- currentOrderId: `null`
- totalEarnings: aumentado

---

## 🎯 PUNTOS DE VERIFICACIÓN

### **✅ Notificaciones Push FCM:**

Revisa los logs del servidor - deberías ver:

```
[OrderAssignmentService] 📲 Notificando a N drivers:
   ✅ Notificación push enviada a Pedro Conductor

[OrderAssignmentService] 📲 Notificación de asignación enviada al usuario

[OrdersService] 📲 Notificación de recogida enviada al usuario

[OrdersService] 📲 Notificación de entrega enviada al usuario
```

### **✅ Historial de Estados:**

Consulta en MySQL:
```sql
SELECT * FROM order_status_history 
WHERE order_id = '{ORDER_ID}' 
ORDER BY changedAt;
```

**Deberías ver:**
1. `pending` → `confirmed`
2. `confirmed` → `searching_driver`
3. `searching_driver` → `driver_assigned`
4. `driver_assigned` → `picking_up`
5. `picking_up` → `picked_up`
6. `picked_up` → `in_transit`
7. `in_transit` → `delivered`

---

## 🐛 TROUBLESHOOTING

### **Error: "No hay drivers disponibles"**
- ✅ Verifica que el driver esté `online` y `isAvailable: true`
- ✅ Verifica que el driver tenga `verificationStatus: 'approved'`
- ✅ Verifica que el driver tenga ubicación GPS actualizada
- ✅ Verifica que el driver esté dentro del radio (15km máximo)

### **Error: "Driver no disponible"**
- ✅ El driver ya tiene un pedido asignado
- ✅ Completa o cancela el pedido anterior primero

### **Error: "Token inválido"**
- ✅ Verifica que estés usando el token correcto (user vs driver)
- ✅ El token expira en 24h - haz login nuevamente

### **No se envían notificaciones push**
- ✅ Verifica que Firebase esté inicializado (check logs al iniciar servidor)
- ✅ Los drivers/users necesitan tener `fcmToken` registrado
- ✅ Solo funcionarán en dispositivos reales con la app móvil instalada

---

## 📈 MÉTRICAS DE ÉXITO

- ✅ Usuario registrado y logueado
- ✅ Driver registrado, aprobado y online
- ✅ Direcciones creadas
- ✅ Pedido creado con cálculo de precio correcto
- ✅ Driver notificado (logs de FCM)
- ✅ Driver acepta pedido
- ✅ Usuario notificado (logs de FCM)
- ✅ Ciclo completo hasta entrega
- ✅ 3 notificaciones push enviadas
- ✅ Driver liberado y ganancia calculada
- ✅ Historial de estados completo

---

¿Necesitas ayuda con algún paso? Revisa los logs del servidor para más detalles 🚀
