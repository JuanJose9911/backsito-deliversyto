import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RegisterDto, VerifyCodeDto } from './dto';
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
}
