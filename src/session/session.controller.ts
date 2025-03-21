//session.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guards';
import { Request } from 'express';
import { ObjectId } from 'mongodb';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createSessionDto: CreateSessionDto, @Req() request : Request) {
    const managerId = request.user['id'];
    createSessionDto.managerId = new ObjectId(managerId);
    console.log('Requête de création de session reçue :', createSessionDto);
    return this.sessionService.create(createSessionDto);
  }

  @Get()
  async findAll() {
    return this.sessionService.findAll();
  }

  @Get('active')
  async findActiveSessions() {
    return this.sessionService.findActiveSessions();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @Get('name/:name')
  async findByName(@Param('name') name: string) {
    return this.sessionService.findByName(name);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionService.update(id, updateSessionDto);
  }

  @Put('name/:name')
  async updateByName(@Param('name') name: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionService.updateByName(name, updateSessionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.sessionService.remove(id);
  }

  @Delete('name/:name')
  async removeByName(@Param('name') name: string) {
    return this.sessionService.removeByName(name);
  }

  @Get(':sessionId/report')
  async getSessionReport(@Param('sessionId') sessionId: string) {
      return this.sessionService.getSessionReport(sessionId);
  }

  @Get(':id/hasDepositedGames')
async checkHasDepositedGames(@Param('id') id: string): Promise<{ hasGames: boolean }> {
  const hasGames = await this.sessionService.hasDepositedGames(id);
  return { hasGames };
}
}
