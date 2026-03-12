import type { Response } from 'express';
import { AuthService } from './auth.service';
import { Body, Controller, Post, Res, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { 
  loginUserSchema,
  registerUserSchema,
  checkSessionSchema,
  refreshAccessTokenSchema,
  type LoginUserDTO,
  type RegisterUserDTO,
  type CheckSessionDTO,
  type RefreshAccessTokenDTO,
} from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerUserSchema))
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
  @UsePipes(new ZodValidationPipe(loginUserSchema))
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

  @Post('check-session')
  @UsePipes(new ZodValidationPipe(checkSessionSchema))
  async checkSession(@Body() dto: CheckSessionDTO) {
    return this.authService.checkSession(dto);
  }

  @Post('refresh-access-token')
  @UsePipes(new ZodValidationPipe(refreshAccessTokenSchema))
  async refreshAccessToken(
    @Body() dto: RefreshAccessTokenDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshAccessToken(dto);

    // Ensure the new access token is automatically set as an HTTP-only cookie as well.
    res.cookie('accessToken', result.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return result;
  }
}
