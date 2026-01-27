import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🔄 Reseteando base de datos...');

  try {
    // 1. Drop todas las tablas
    await dataSource.dropDatabase();
    console.log('✅ Base de datos eliminada');

    // 2. Sincronizar (crear todas las tablas)
    await dataSource.synchronize();
    console.log('✅ Tablas creadas');

    // 3. Cargar datos de prueba
    console.log('🌱 Cargando datos de prueba...');

    // Usuarios de prueba
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await dataSource.query(`
      INSERT INTO users (id, email, password, name, phone, isActive, isVerified, verifiedAt, createdAt, updatedAt) VALUES
      (UUID(), 'juan@test.com', '${hashedPassword}', 'Juan Pérez', '+573001234567', 1, 1, NOW(), NOW(), NOW()),
      (UUID(), 'maria@test.com', '${hashedPassword}', 'María García', '+573007654321', 1, 1, NOW(), NOW(), NOW()),
      (UUID(), 'carlos@test.com', '${hashedPassword}', 'Carlos López', '+573009876543', 1, 0, NULL, NOW(), NOW())
    `);
    console.log('✅ Usuarios creados');

    // Repartidores de prueba
    await dataSource.query(`
      INSERT INTO drivers (
        id, name, email, password, phone, birthDate, documentType, documentNumber,
        status, isAvailable, isActive, verificationStatus, totalEarnings,
        pushNotificationsEnabled, smsNotificationsEnabled, createdAt, updatedAt
      ) VALUES
      (UUID(), 'Pedro Conductor', 'repartidor1@test.com', '${hashedPassword}', '+573101234567', 
       '1990-05-15', 'CC', '1234567890', 'online', 1, 1, 'approved', 500000, 1, 1, NOW(), NOW()),
      (UUID(), 'Ana Delivery', 'repartidor2@test.com', '${hashedPassword}', '+573107654321',
       '1992-08-20', 'CC', '9876543210', 'offline', 1, 1, 'approved', 750000, 1, 1, NOW(), NOW())
    `);
    console.log('✅ Repartidores creados');

    // Direcciones de prueba
    const users = await dataSource.query('SELECT id FROM users LIMIT 2');
    if (users.length >= 2) {
      await dataSource.query(`
        INSERT INTO addresses (
          id, user_id, latitude, longitude, formattedAddress, city, state, country,
          placeId, label, isFavorite, createdAt, updatedAt
        ) VALUES
        (UUID(), '${users[0].id}', 4.6869, -74.0543, 'Calle 100 #15-20, Bogotá', 'Bogotá', 'Cundinamarca', 
         'Colombia', 'ChIJ0T2NLikpFY4Rxb9iKgznGNA', 'home', 1, NOW(), NOW()),
        (UUID(), '${users[0].id}', 4.6097, -74.0817, 'Carrera 7 #32-16, Bogotá', 'Bogotá', 'Cundinamarca',
         'Colombia', 'ChIJabcdef123456789xyz1234', 'work', 0, NOW(), NOW()),
        (UUID(), '${users[1].id}', 4.6560, -74.1078, 'Avenida El Dorado #68-90, Bogotá', 'Bogotá', 'Cundinamarca',
         'Colombia', 'ChIJxyz987654321abcdef9876', 'other', 1, NOW(), NOW())
      `);
      console.log('✅ Direcciones creadas');
    }

    console.log('\n🎉 Base de datos reseteada con éxito!');
    console.log('\n📋 Credenciales de prueba:');
    console.log('   Email: juan@test.com | maria@test.com | carlos@test.com');
    console.log('   Email (drivers): repartidor1@test.com | repartidor2@test.com');
    console.log('   Password (todos): 123456');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error reseteando base de datos:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
