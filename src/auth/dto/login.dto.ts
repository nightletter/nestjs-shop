import { PartialType } from '@nestjs/mapped-types';
import { SignupDto } from '@/auth/dto/signup.dto';

export class LoginDto extends PartialType(SignupDto) {}
