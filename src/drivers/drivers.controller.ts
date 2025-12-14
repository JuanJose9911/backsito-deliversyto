import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import {
  RegisterDriverDto,
  UpdateLocationDto,
  UpdateDriverDto,
  UpdateStatusDto,
} from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDriverDto: RegisterDriverDto) {
    return this.driversService.register(registerDriverDto);
  }

  @Patch('location')
  @UseGuards(JwtAuthGuard)
  async updateLocation(
    @Request() req: any,
    @Body() locationDto: UpdateLocationDto,
  ) {
    const driverId = req.user.sub;
    return this.driversService.updateLocation(
      driverId,
      locationDto.latitude,
      locationDto.longitude,
    );
  }

  @Get('available')
  async getAvailableDrivers(@Query('vehicleType') vehicleType?: string) {
    return this.driversService.getAvailableDrivers(vehicleType);
  }

  @Get()
  async findAll() {
    return this.driversService.findAll();
  }
  
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    console.log('ola',req);
    
    const driverId = req.user.sub;
    return this.driversService.getProfile(driverId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }


  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.driversService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    return this.driversService.update(id, updateDriverDto);
  }
}
