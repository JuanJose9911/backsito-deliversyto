# Copilot Instructions for Backend Project

## Architecture Overview
This is a NestJS backend application with TypeORM/MySQL integration and modular architecture. The project follows NestJS conventions with separation between modules, controllers, services, and entities.

**Key Components:**
- `src/app.module.ts` - Root module importing DatabaseModule and feature modules
- `src/database/database.module.ts` - Pure TypeORM configuration module
- `src/users/` - Users feature module with entity, service, and controller
- Authentication stack: JWT + Passport with bcryptjs for password hashing (planned)
- MySQL database with TypeORM ORM

## Project Structure Patterns
```
src/
├── app.{module,controller,service}.ts  # Root app components
├── main.ts                             # Application entry point
├── config/
│   └── database.config.ts             # Database configuration
├── database/
│   └── database.module.ts             # Pure TypeORM configuration
└── users/                              # Users feature module
    ├── users.module.ts                # Module definition with TypeORM.forFeature
    ├── users.controller.ts            # REST endpoints
    ├── users.service.ts               # Business logic
    └── user.entity.ts                 # TypeORM entity
```

## Development Commands
```bash
# Development with hot reload
npm run start:dev

# Build and production
npm run build
npm run start:prod

# Testing
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests  
npm run test:cov      # Coverage report

# Code quality
npm run lint          # ESLint with auto-fix
npm run format        # Prettier formatting
```

## Database Configuration & Entities
The project includes a complete MySQL database setup:
- `src/config/database.config.ts` - Environment-based database configuration with migrations support
- `src/users/user.entity.ts` - User entity with email/password fields
- Database module provides TypeORM configuration only
- Feature modules handle their own entities via TypeOrmModule.forFeature()
- Synchronize disabled in production, automatic in development

## TypeScript & NestJS Conventions
- **Modern TS config**: Uses ES2023 target, nodenext modules, strict null checks
- **ESLint**: TypeScript ESLint with Prettier integration, disabled explicit-any rule
- **Decorators**: Experimental decorators enabled for NestJS metadata
- **Module pattern**: Each feature has its own module with imports/exports
- **Dependency injection**: Constructor-based injection throughout

## Authentication Architecture
Based on package.json dependencies:
- **JWT Strategy**: `@nestjs/jwt` + `passport-jwt` (ready for implementation)
- **Local Strategy**: `passport-local` for login (ready for implementation)
- **Password hashing**: `bcryptjs` (ready for implementation)
- **User management**: Dedicated users module with CRUD operations

## Environment Variables
Required environment variables for database connection:
```bash
DB_HOST=localhost           # Database host
DB_PORT=3306               # Database port  
DB_USERNAME=root           # Database username
DB_PASSWORD=password       # Database password
DB_DATABASE=auth_db        # Database name
NODE_ENV=development       # Controls synchronize/logging
```

## Database Integration
- **ORM**: TypeORM with MySQL2 driver
- **Config**: Async configuration using `@nestjs/config`
- **Entities**: Exported from DatabaseModule for repository injection
- **Connection**: Factory pattern with ConfigService injection

## Testing Patterns
- **Unit tests**: Jest with `.spec.ts` files alongside source
- **E2E tests**: Supertest with full application bootstrap in `test/` directory
- **Module testing**: Use `Test.createTestingModule()` for isolated testing

## When Adding Features
1. Create module first (`nest g module feature`)
2. Add entities to `database.module.ts` entities array
3. Export TypeOrmModule.forFeature([Entity]) from feature module
4. Inject Repository<Entity> into services
5. Write tests before implementation