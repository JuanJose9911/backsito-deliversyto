import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  UnauthorizedException,
  Redirect,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LoginDto, RegisterDto, VerifyCodeDto, CompleteProfileDto } from './dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('verify')
  async verifyCode(@Body() verifyDto: VerifyCodeDto) {
    return this.authService.verifyCode(verifyDto.userId, verifyDto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Public()
  @Post('driver/login')
  async loginDriver(@Body() loginDto: LoginDto) {
    const driver = await this.authService.validateDriver(
      loginDto.email,
      loginDto.password,
    );
    if (!driver) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.loginDriver(driver);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Redirige a Google para autenticación
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req: any) {
    const result = await this.authService.googleLogin(req.user);
    
    // Para apps móviles: Retornar JSON directamente
    // La app captura esta respuesta del WebView/navegador
    return {
      success: true,
      access_token: result.access_token,
      user: result.user,
      needsPhone: !result.user.isProfileComplete,
    };

    /* 
    // Para web: Descomentar si usas frontend web separado
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}&needsPhone=${!result.user.isProfileComplete}`;
    
    return { 
      url: redirectUrl,
      statusCode: 302
    };
    */

    /* 
    // Para móvil con Deep Links: Descomentar si usas deep linking
    const deepLink = `myapp://auth/callback?token=${result.access_token}&needsPhone=${!result.user.isProfileComplete}`;
    
    return { 
      url: deepLink,
      statusCode: 302
    };
    */
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete-profile')
  async completeProfile(@Request() req: any, @Body() completeProfileDto: CompleteProfileDto) {
    return this.authService.completeProfile(req.user.id, completeProfileDto.phone);
  }
}
