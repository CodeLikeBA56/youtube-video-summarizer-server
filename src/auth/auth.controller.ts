import type { Response } from 'express';
import { AuthService } from './auth.service';
import { Body, Controller, Post, Res } from '@nestjs/common';
import type { LoginUserDTO, RegisterUserDTO } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerUserDTO: RegisterUserDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signUpWithEmail(registerUserDTO);

    // Set cookies
    res.cookie('accessToken', result.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return result;
  }

  @Post('login')
  async login(
    @Body() loginUserDTO: LoginUserDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signInWithEmail(loginUserDTO);

    // Set cookies
    res.cookie('accessToken', result.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return result;
  }
}
