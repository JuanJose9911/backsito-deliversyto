import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DriversService } from '../drivers/drivers.service';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private driversService: DriversService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.comparePasswords(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
    };
  }

  async register(registerDto: { email: string; password: string; name: string; phone: string }) {
    
    try {
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new UnauthorizedException('El usuario ya existe');
      }

      const hashedPassword = await this.hashPassword(registerDto.password);
      
      const user = await this.usersService.create({
        ...registerDto,
        password: hashedPassword,
      });
      
      const { password: _, ...userWithoutPassword } = user;
      return this.login(userWithoutPassword);
    } catch (error) {
      throw error;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.usersService.findOne(userId);
  }

  async validateDriver(email: string, password: string): Promise<any> {
    const driver = await this.driversService.findByEmail(email);
    if (driver && await this.comparePasswords(password, driver.password)) {
      const { password: _, ...result } = driver;
      return result;
    }
    return null;
  }

  async loginDriver(driver: any) {
    const payload = { email: driver.email, sub: driver.id, type: 'driver' };
    return {
      access_token: this.jwtService.sign(payload),
      driver: {
        id: driver.id,
        email: driver.email,
        name: driver.name,
        phone: driver.phone,
        status: driver.status,
        verificationStatus: driver.verificationStatus
      },
    };
  }

  async validateDriverById(driverId: string): Promise<any> {
    console.log('validateDriverById', driverId);
    const driver = await this.driversService.findOne(driverId);
    if (!driver) {
      return null;
    }
    return driver;
  }
}
