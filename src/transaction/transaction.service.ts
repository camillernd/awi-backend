//src/transaction/transaction.service.ts :
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

  async findBySessionId(sessionId: string): Promise<Transaction[]> {
    const transactions = await this.transactionModel
      .find({ sessionId: sessionId }).exec();
    return transactions;
  }  

  //SARAH : il me manquait des attributs dans cette méthode ex : nom vendeur, email etc
  async findAll(): Promise<Transaction[]> {
    return this.transactionModel
      .find()
      .populate([
        { path: 'labelId', select: 'salePrice', populate: { path: 'gameDescriptionId', select: 'name' } }, // Populate imbriqué
        { path: 'sessionId', select: 'sessionId name' },
        { path: 'sellerId', select: 'sellerId name email' },
        { path: 'clientId', select: 'clientId name email' },
        { path: 'managerId', select: 'managerId firstName lastName' },
      ])
      .exec();
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

  async createMultipleTransactions(
    transactions: { labelId: string; sessionId: string; sellerId: string; clientId: string }[],
    managerId: string,
  ): Promise<Transaction[]> {
    const createdTransactions: Transaction[] = [];
  
    for (const transactionData of transactions) {
      const depositedGame = await this.depositedGameModel.findById(transactionData.labelId);
      if (!depositedGame) {
        throw new NotFoundException(`Deposited game with ID ${transactionData.labelId} not found`);
      }
      if (!depositedGame.forSale) {
        throw new BadRequestException(`Game with ID ${transactionData.labelId} is not for sale`);
      }
  
      // Marquer le jeu comme vendu
      depositedGame.forSale = false;
      depositedGame.sold = true;
      await depositedGame.save();
  
      // Récupérer la session et le vendeur
      const session = await this.sessionModel.findById(transactionData.sessionId);
      const seller = await this.sellerModel.findById(transactionData.sellerId);
  
      if (!session || !seller) {
        throw new NotFoundException('Session or Seller not found');
      }
  
      // Calculer et ajouter le montant dû au vendeur
      const saleCommission = session.saleComission;
      const amountToAdd = depositedGame.salePrice - depositedGame.salePrice * saleCommission/100;
      seller.amountOwed += amountToAdd;
      await seller.save();
  
      // Créer la transaction
      const transaction = new this.transactionModel({
        ...transactionData,
        managerId,
        transactionDate: new Date(),
      });
      const savedTransaction = await transaction.save();
      createdTransactions.push(savedTransaction);
    }
  
    return createdTransactions;
  }

  async findByClientId(clientId: string): Promise<Transaction[]> {
    const transactions = await this.transactionModel
      .find({ clientId: clientId }) // Recherche toutes les transactions associées à clientId
      .populate([
        { path: 'labelId', populate: { path: 'gameDescriptionId', select: 'name' } }, // Populate imbriqué pour les jeux
        { path: 'sessionId', select: 'name' }, // Populate session
        { path: 'sellerId', select: 'name email' },  // Populate vendeur
        { path: 'managerId', select: 'firstName lastName' }, // Populate manager
      ])
      .exec();
  
    if (!transactions || transactions.length === 0) {
      throw new NotFoundException(`No transactions found for client with ID ${clientId}`);
    }
  
    return transactions;
  }

  //SARAH : ajout d'une méthode pour récup les transactions par vendeur
  async findBySellerId(sellerId: string): Promise<Transaction[]> {
    const transactions = await this.transactionModel
      .find({ sellerId: sellerId }) // Recherche toutes les transactions associées à sellerId
      .populate([
        { path: 'labelId', populate: { path: 'gameDescriptionId', select: 'name' } }, // Populate imbriqué pour les jeux
        { path: 'sessionId', select: 'name' }, // Populate session
        { path: 'clientId', select: 'name email' },  // Populate vendeur
        { path: 'managerId', select: 'firstName lastName' }, // Populate manager
      ])
      .exec();
  
    if (!transactions || transactions.length === 0) {
      throw new NotFoundException(`No transactions found for seller with ID ${sellerId}`);
    }
  
    return transactions;
  }
  
}
