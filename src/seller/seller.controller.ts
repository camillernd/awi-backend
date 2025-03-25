import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
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

  @Get()
  async findAll() {
    return this.sellerService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sellerService.findOne(id);
  }

  @Get('session/:sessionId')
  async findBySessionId(@Param('sessionId') sessionId: String) {
    return this.sellerService.findBySessionId(sessionId);
  } 

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.sellerService.findByEmail(email);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSellerDto: UpdateSellerDto) {
    return this.sellerService.update(id, updateSellerDto);
  }

  @Put('email/:email')
  async updateByEmail(@Param('email') email: string, @Body() updateSellerDto: UpdateSellerDto) {
    return this.sellerService.updateByEmail(email, updateSellerDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.sellerService.remove(id);
  }

  @Delete('email/:email')
  async removeByEmail(@Param('email') email: string) {
    return this.sellerService.removeByEmail(email);
  }
}
