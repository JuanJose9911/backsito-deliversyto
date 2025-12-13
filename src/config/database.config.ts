import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const config: any = {
    type: 'mysql' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    database: process.env.DB_DATABASE || 'DOMIS',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: false, // Habilitado temporalmente para crear tabla addresses
    dropSchema: false, // No eliminar el schema existente
    logging: process.env.NODE_ENV === 'development',
    migrations: ['dist/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
  };

  // Solo agregar password si existe y no está vacía
  if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '') {
    config.password = process.env.DB_PASSWORD;
  }

  return config;
});
