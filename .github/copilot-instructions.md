# Copilot Instructions for Shop Repository

## Quick Start

This is a NestJS e-commerce backend with TypeORM, JWT auth, Redis, and BullMQ job queues.

**Install & Run:**
```bash
pnpm install
pnpm start:dev        # Development with watch mode
pnpm start:prod       # Production build & run
```

## Build, Test & Lint

```bash
# Build
pnpm run build

# Tests
pnpm test                 # Unit tests (Jest, src/**/*.spec.ts)
pnpm test:watch          # Unit tests in watch mode
pnpm test:cov            # Coverage report
pnpm test:e2e            # E2E tests (test/**/*.e2e-spec.ts)

# Formatting & Linting
pnpm run format          # Format code with Prettier
pnpm run lint            # Fix ESLint issues
```

## Architecture Overview

**Module Structure:**
- **auth**: JWT authentication with guards and DTOs
- **users**: User entity, signup events
- **products**: Product catalog with categories, prices, and sizes
- **order**: Order management with payment flow and event publishing
- **payment**: Toss payment integration client
- **points**: Points system with Redis-backed balance
- **notifications**: Notification storage for order events
- **common**: Shared database, Redis, decorators, constants

**Key Patterns:**
1. **Database**: MySQL with TypeORM, `autoLoadEntities: true`, transactional support via `typeorm-transactional`
2. **Events**: `@nestjs/event-emitter` for async event handling (e.g., user signup, order created)
3. **Queues**: BullMQ for async job processing (`QueueNames.POINTS`, `QueueNames.NOTIFICATIONS`)
4. **Redis**: Shared Redis module for caching and streams
5. **Auth**: JWT with `@nestjs/jwt`, `@nestjs/passport`, JwtGuard protects routes
6. **Validation**: Global ValidationPipe with `whitelist: true, forbidNonWhitelisted: true, transform: true`

## Code Conventions

**Naming:**
- Services use default exports (e.g., `export default class OrderService`)
- DTOs use `.request.ts` / `.response.ts` suffixes for clarity
- Validators, Clients, and Processors are standalone providers
- Event classes named `<Entity>-<Action>.event.ts` (e.g., `user-signup.event.ts`)

**Module Structure:**
Each feature module follows this pattern:
```
feature/
  dto/               # DTOs for requests/responses
  entities/          # TypeORM entities
  events/            # Event classes (if applicable)
  <feature>.module.ts
  <feature>.service.ts
  <feature>.controller.ts
```

**Services:**
- Use dependency injection via constructor
- Annotate repositories with `@InjectRepository(Entity)`
- For transactional operations, wrap logic and mark methods with `@Transactional()`

**Controllers:**
- Use `@UseGuards(JwtGuard)` to protect routes requiring auth
- Use `@CurrentUser()` decorator (from `common/decorators`) to extract user from JWT payload
- Return structured responses via DTOs

**Testing:**
- Tests placed alongside source: `<feature>.spec.ts`
- Use `Test.createTestingModule()` to set up testing module
- E2E tests in `test/` directory with `.e2e-spec.ts` suffix

**Event System:**
- Emit events with `EventEmitter.emit(eventName, data)`
- Listen with `@OnEvent(eventName)` decorator
- Wildcard events supported (delimited by `.`)

**Queue Processing:**
- Register queues in module with `BullModule.registerQueue({ name: QueueName })`
- Create processor classes with job methods
- Inject queue with `@InjectQueue(QueueName)`

**View Engine:**
- Handlebars (HBS) configured for server-side rendering
- Views in `src/views`, static assets in `src/public`
- Set via `app.engine()` and `app.useStaticAssets()`

## Environment Setup

Configuration loaded from `.env` via `@nestjs/config`:
- Key variables: `PORT`, `database.*`, JWT secrets, Redis connection
- Access with `ConfigService.get<Type>(key)`
- Typed config in `src/config/configuration.ts`

## Common Gotchas

- **Database schema reset**: `dropSchema: true` enabled in development (data resets on restart)
- **Transaction handling**: Requires `initializeTransactionalContext()` in bootstrap
- **Entity scanning**: Entities auto-loaded; register in `DatabaseModule.forFeature()` when adding new ones
- **BullMQ queues**: Register in module, create dedicated processor, inject with `@InjectQueue()`
- **Event emitter**: Use dotted names like `order.created` for organizational clarity
