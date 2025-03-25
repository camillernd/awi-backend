// auth.controller.ts

import { Body, Controller, Post, UseGuards, Get, Req, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './local-auth.guards';
import { JwtAuthGuard } from './jwt-auth.guards';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}


  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { token, isAdmin } = await this.authService.generateJwtToken(loginDto);
    return { token, isAdmin };
  }

  // Route pour récupérer le profil du manager
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request & { user: { id: string; email: string } }) {
    // Le JWT fournit le champ `user` avec les détails nécessaires
    const userId = req.user['id'];
    if (!userId) throw new NotFoundException('Manager ID not found in token payload');
    return this.authService.getManagerProfileById(userId);
  }
}
