import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';
import { Request } from 'express';
import { Transaction } from '../schemas/transaction.schema'; // Ajout de l'import

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Req() req: Request) {
    const managerId = req.user.id;
    return this.transactionService.createTransaction(createTransactionDto, managerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.transactionService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  async createMultipleTransactions(@Body() transactions: any[], @Req() req: Request) {
    const managerId = req.user.id;
    return this.transactionService.createMultipleTransactions(transactions, managerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Transaction[]> {
    return this.transactionService.findAll();
  }
}
