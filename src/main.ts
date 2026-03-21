import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseSeederService } from './common/database/database-seeder.service';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  const databaseSeederService = app.get(DatabaseSeederService);
  await databaseSeederService.seed();
}

void bootstrap();
