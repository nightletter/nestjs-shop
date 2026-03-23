import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtGuard } from './guards/jwt.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard],
  exports: [AuthService, JwtModule, JwtGuard],
})
export class AuthModule {}
