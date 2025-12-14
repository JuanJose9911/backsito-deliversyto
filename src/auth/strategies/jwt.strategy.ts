import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // Si es un driver
    if (payload.type === 'driver') {
      const driver = await this.authService.validateDriverById(payload.sub);
      if (!driver) {
        throw new UnauthorizedException('Repartidor no encontrado');
      }
      return {
        sub: driver.id,
        id: driver.id,
        email: driver.email,
        name: driver.name,
        type: 'driver'
      };
    }
    
    // Si es un usuario normal
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      type: 'user'
    };
  }
}
