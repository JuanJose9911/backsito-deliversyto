import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Request() req: any, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(req.user.sub, createAddressDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.addressesService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.addressesService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, req.user.sub, updateAddressDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.addressesService.remove(id, req.user.sub);
  }

  @Patch(':id/favorite')
  setFavorite(@Request() req: any, @Param('id') id: string) {
    return this.addressesService.setFavorite(id, req.user.sub);
  }
}
