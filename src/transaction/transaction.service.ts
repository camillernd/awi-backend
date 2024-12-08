import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { DepositedGame, DepositedGameDocument } from '../schemas/depositedGame.schema';
import { Seller, SellerDocument } from '../schemas/seller.schema';
import { Session, SessionDocument } from '../schemas/session.schema';
import { Client, ClientDocument } from '../schemas/client.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(DepositedGame.name) private readonly depositedGameModel: Model<DepositedGameDocument>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<SellerDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto, managerId: string): Promise<Transaction> {
    const { labelId, sessionId, sellerId, clientId } = createTransactionDto;

    // 1. Verify that the DepositedGame exists
    const depositedGame = await this.depositedGameModel.findById(labelId);
    if (!depositedGame) {
      throw new NotFoundException('Deposited game not found');
    }

    // 2. Check if the game is for sale and not picked up
    if (!depositedGame.forSale || depositedGame.pickedUp) {
      throw new BadRequestException('Deposited game is either not for sale or has been picked up');
    }

    // 3. Verify the session and ensure it's currently open
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const currentDate = new Date();
    if (currentDate < session.startDate || currentDate > session.endDate) {
      throw new BadRequestException('The associated session is not currently open');
    }

    // 4. Verify the client exists
    const client = await this.clientModel.findById(clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // 5. Verify the seller exists
    const seller = await this.sellerModel.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // 6. Update the DepositedGame's status
    depositedGame.forSale = false;
    depositedGame.sold = true;
    await depositedGame.save();

    // 7. Update the seller's amount owed
    const salePrice = depositedGame.salePrice;
    const saleCommission = session.saleComission;
    const amountToAdd = salePrice - salePrice * saleCommission;
    seller.amountOwed += amountToAdd;
    await seller.save();

    // 8. Create and save the transaction
    const transaction = new this.transactionModel({
      ...createTransactionDto,
      managerId,
      transactionDate: new Date(),
    });
    return transaction.save();
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.transactionModel.findByIdAndUpdate(id, updateTransactionDto, { new: true }).exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async remove(id: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findByIdAndDelete(id).exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }
}
