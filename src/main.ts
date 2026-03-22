import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseSeederService } from './common/database/database-seeder.service';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import hbs from 'hbs';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.engine('html', hbs.__express);
  app.setViewEngine('html');
  app.useStaticAssets(join(__dirname, 'public'));

  await app.listen(process.env.PORT ?? 3000);

  const databaseSeederService = app.get(DatabaseSeederService);
  await databaseSeederService.seed();
}

void bootstrap();
