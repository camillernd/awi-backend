import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SellerService } from './seller.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post()
  async create(@Body() createSellerDto: CreateSellerDto) {
    return this.sellerService.create(createSellerDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sellerService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSellerDto: UpdateSellerDto) {
    return this.sellerService.update(id, updateSellerDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.sellerService.remove(id);
  }
}
