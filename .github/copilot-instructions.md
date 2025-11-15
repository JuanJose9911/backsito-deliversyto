# Copilot Instructions for Backend Project

## Architecture Overview
This is a NestJS backend application with TypeORM/MySQL integration and JWT authentication. The project follows NestJS conventions with separation between modules, controllers, services, and entities.

**Key Components:**
- `src/app.module.ts` - Root module with global JWT authentication guard
- `src/database/database.module.ts` - Pure TypeORM configuration module
- `src/users/` - Users feature module with entity, service, and controller
- `src/auth/` - Complete JWT authentication module with guards and strategies
- MySQL database with TypeORM ORM

## Project Structure Patterns
```
src/
├── app.{module,controller,service}.ts  # Root app components with global JWT guard
├── main.ts                             # Application entry point with ValidationPipe
├── config/
│   └── database.config.ts             # Database configuration
├── database/
│   └── database.module.ts             # Pure TypeORM configuration
├── users/                              # Users feature module
│   ├── users.module.ts                # Module definition with TypeORM.forFeature
│   ├── users.controller.ts            # REST endpoints (protected by JWT)
│   ├── users.service.ts               # Business logic
│   ├── user.entity.ts                 # TypeORM entity
│   └── dto/                           # Data Transfer Objects with validation
│       ├── index.ts                   # Export all DTOs
│       ├── create-user.dto.ts         # DTO for creating users
│       └── update-user.dto.ts         # DTO for updating users
└── auth/                               # Authentication module
    ├── auth.module.ts                 # JWT + Passport configuration
    ├── auth.{service,controller}.ts   # Auth logic and endpoints
    ├── strategies/                    # Passport strategies (JWT, Local)
    ├── guards/                        # Authentication guards
    ├── decorators/                    # @Public decorator for open endpoints
    └── dto/                           # DTOs for authentication
        ├── index.ts                   # Export all auth DTOs
        ├── login.dto.ts               # DTO for login
        └── register.dto.ts            # DTO for registration
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
Complete JWT authentication system:
- **JWT Strategy**: `@nestjs/jwt` + `passport-jwt` for token validation
- **Local Strategy**: `passport-local` for email/password login
- **Password hashing**: `bcryptjs` with salt rounds
- **Global JWT Guard**: Protects all routes by default
- **@Public decorator**: Marks specific routes as publicly accessible
- **Authentication endpoints**: `/auth/login`, `/auth/register`, `/auth/profile`

## Environment Variables
Required environment variables for database connection and JWT:
```bash
DB_HOST=localhost           # Database host
DB_PORT=3306               # Database port  
DB_USERNAME=root           # Database username
DB_PASSWORD=               # Database password (empty for no password)
DB_DATABASE=DOMIS          # Database name
NODE_ENV=development       # Controls synchronize/logging
JWT_SECRET=your_secret     # JWT signing secret (change in production)
JWT_EXPIRES_IN=24h         # JWT token expiration time
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

## DTO Patterns & Validation
The project uses a structured approach for Data Transfer Objects:
- **DTOs location**: Each module has its own `dto/` folder with all related DTOs
- **Validation**: Uses `class-validator` decorators for automatic validation
- **Index files**: `dto/index.ts` exports all DTOs for clean imports
- **Naming convention**: `create-*.dto.ts`, `update-*.dto.ts`, `login.dto.ts`, etc.
- **Global validation**: ValidationPipe configured in main.ts with whitelist and transform options

## When Adding Features
1. Create module first (`nest g module feature`)
2. Add entities to `database.module.ts` entities array
3. Export TypeOrmModule.forFeature([Entity]) from feature module
4. Inject Repository<Entity> into services
5. Write tests before implementation