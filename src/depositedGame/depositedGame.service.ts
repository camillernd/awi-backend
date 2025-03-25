//depositedGame.service.ts
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateDepositedGameDto } from './dto/create-depositedGame.dto';
import { UpdateDepositedGameDto } from './dto/update-depositedGame.dto';

import { SessionService } from 'src/session/session.service';
import { DepositedGame, DepositedGameDocument } from '../schemas/depositedGame.schema';
import { Session, SessionDocument } from '../schemas/session.schema';
import { Seller, SellerDocument } from '../schemas/seller.schema';
import { GameDescription } from '../schemas/gameDescription.schema';

@Injectable()
export class DepositedGameService {
  constructor(
    @InjectModel(DepositedGame.name) private depositedGameModel: Model<DepositedGameDocument>,
    @InjectModel(Session.name) private sessionModel: Model<Session>, // Le modèle Session est bien injecté ici
    @InjectModel(Seller.name) private sellerModel: Model<Seller>,
    @InjectModel(GameDescription.name) private gameDescriptionModel: Model<GameDescription>,
    @Inject(forwardRef(() => SessionService)) private sessionService: SessionService, // Utilisez forwardRef ici
  ) {}

  // Vérifie que la session, le vendeur et la description de jeu existent dans la base de donnée 
  private async validateForeignKeys(
    sessionId: string | Types.ObjectId,
    sellerId: string | Types.ObjectId,
    gameDescriptionId: string | Types.ObjectId,
  ) {
    const sessionObjectId = typeof sessionId === 'string' ? new Types.ObjectId(sessionId) : sessionId;
    const sellerObjectId = typeof sellerId === 'string' ? new Types.ObjectId(sellerId) : sellerId;
    const gameDescriptionObjectId = typeof gameDescriptionId === 'string' ? new Types.ObjectId(gameDescriptionId) : gameDescriptionId;
  
    
    const session = await this.sessionModel.findById(sessionObjectId).exec();
    if (!session) throw new NotFoundException('Session not found');

    const seller = await this.sellerModel.findById(sellerObjectId).exec();
    if (!seller) throw new NotFoundException('Seller not found');

    const gameDescription = await this.gameDescriptionModel.findById(gameDescriptionObjectId).exec();
    if (!gameDescription) throw new NotFoundException('GameDescription not found');
  }

  // Méthode de création d'un dépot de jeu
  // - Valide les clés étrangères 
  // - Vérifie que la session est ouverte 
  // - Initialise sold, pickedUp et forSale à faux
  async create(createDepositedGameDto: CreateDepositedGameDto): Promise<DepositedGame> {
    const { sessionId, sellerId, gameDescriptionId } = createDepositedGameDto;
  
    // Valider les clés étrangères
    await this.validateForeignKeys(sessionId, sellerId, gameDescriptionId);
  
    // Vérifier si la session est ouverte
    const isSessionOpen = await this.sessionService.isOpened(sessionId.toString());
    if (!isSessionOpen) {
      throw new ConflictException('Cannot create a deposited game for a closed session');
    }
  
    // Initialiser les champs `sold`, `forSale`, `pickedUp` à `false`
    createDepositedGameDto.sold = false;
    createDepositedGameDto.pickedUp = false;

    // ✅ Conserver la valeur envoyée pour `forSale`
    createDepositedGameDto.forSale = createDepositedGameDto.forSale ?? false;
  
    // Créer le jeu déposé
    return this.depositedGameModel.create(createDepositedGameDto);
  }

  // Nouvelle méthode pour créer un DepositedGame sans sessionId
  async createWithoutSessionId(sellerId: string, gameDescriptionId: string, salePrice: number): Promise<DepositedGame> {
    // Recherche d'une session ouverte
    const openSession = await this.sessionService.getOpenSession();

    // Crée un DepositedGame en utilisant l'ID de la session ouverte
    const depositedGame = new this.depositedGameModel({
      sessionId: openSession._id,
      sellerId,
      gameDescriptionId,
      salePrice,
      forSale: false,
      pickedUp: false,
    });

    return depositedGame.save();
  }

  async findAll(): Promise<DepositedGame[]> {
    return this.depositedGameModel
      .find()
      .populate('gameDescriptionId', 'name publisher photoURL description minPlayers maxPlayers ageRange') // Inclut tous les champs nécessaires
      .populate('sellerId', 'name email') // Inclut le nom du vendeur
      .populate('sessionId', 'name saleComission')
      .exec();
  }

  async findBySellerId(sellerId: string): Promise<DepositedGame[]> {
    const depositedGames = await this.depositedGameModel
      .find({ sellerId: sellerId }) // Recherche toutes les depositedGames associées à sellerId
      .populate([
        { path: 'gameDescriptionId', select: 'name publisher photoURL description minPlayers maxPlayers ageRange' }, // Populate le jeu déposé
        { path: 'sessionId', select: 'name startDate endDate' }, // Populate la session
        { path: 'sellerId', select: 'name email' },  // Populate le vendeur
      ])
      .exec();
  
    if (!depositedGames || depositedGames.length === 0) {
      throw new NotFoundException(`No depositedGames found for seller with ID ${sellerId}`);
    }
  
    return depositedGames;
  }
  

  async findBySellerAndSession(sellerId: string, sessionId: string): Promise<DepositedGame[]> {
    return this.depositedGameModel
      .find({
        sellerId: new Types.ObjectId(sellerId),
        sessionId: new Types.ObjectId(sessionId),
      })
      .populate('gameDescriptionId', 'name publisher photoURL description minPlayers maxPlayers ageRange') // Inclut tous les champs nécessaires
      .populate('sellerId', 'name email') // Inclut le nom du vendeur
      .exec();
  }

  async getSessions(): Promise<Session[]> {
    return this.sessionModel.find().exec();
  }
  
  async getSellers(): Promise<Seller[]> {
    return this.sellerModel.find().exec();
  }
  

  async findOne(id: string): Promise<DepositedGame> {
    const game = await this.depositedGameModel
      .findById(id)
      .populate('gameDescriptionId', 'name publisher photoURL description minPlayers maxPlayers ageRange') // Inclut tous les champs nécessaires
      .populate('sessionId', '_id name')
      .populate('sellerId', '_id name email') // Inclut le nom et l'email du vendeur
      .exec();

    if (!game) {
      throw new NotFoundException('Deposited game not found');
    }

    console.log('Seller details:', game.sellerId); // Vérifiez si les détails du vendeur sont récupérés
    return game;
  }

  async update(id: string, updateDepositedGameDto: UpdateDepositedGameDto): Promise<DepositedGame> {
    if (updateDepositedGameDto.sessionId || updateDepositedGameDto.sellerId || updateDepositedGameDto.gameDescriptionId) {
      await this.validateForeignKeys(
        updateDepositedGameDto.sessionId ?? id,
        updateDepositedGameDto.sellerId ?? id,
        updateDepositedGameDto.gameDescriptionId ?? id,
      );
    }

    const updatedGame = await this.depositedGameModel.findByIdAndUpdate(id, updateDepositedGameDto, { new: true }).exec();
    if (!updatedGame) {
      throw new NotFoundException('Deposited game not found');
    }
    return updatedGame;
  }

  async remove(id: string): Promise<DepositedGame> {
    const game = await this.depositedGameModel.findByIdAndDelete(id).exec();
    if (!game) {
      throw new NotFoundException('Deposited game not found');
    }
    return game;
  }

  async setForSale(id: string): Promise<DepositedGame> {
    const game = await this.findOne(id);
    if (game.pickedUp) {
      throw new ConflictException("Cannot set 'forSale' to true for a game that has been picked up");
    }
    game.forSale = true;
    return game.save();
  }

  async removeFromSale(id: string): Promise<DepositedGame> {
    const game = await this.findOne(id);
    game.forSale = false;
    return game.save();
  }

  async markAsPickedUp(id: string): Promise<DepositedGame> {
    const game = await this.findOne(id);
    game.forSale = false;
    game.pickedUp = true;
    return game.save();
  }

  async updateDepositedGame(id: string, updateData: any): Promise<DepositedGame> {
    const depositedGame = await this.depositedGameModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!depositedGame) {
      throw new NotFoundException('Jeu déposé non trouvé');
    }
    return depositedGame;
  }

  async findBySessionId(sessionId: string): Promise<DepositedGame[]> {
    const depositedGames = await this.depositedGameModel
      .find({ sessionId })
      .populate('gameDescriptionId', 'name publisher photoURL description')
      .populate('sessionId', 'name saleComission') // Inclure les champs nécessaires
      .exec();
  
    console.log(
      depositedGames.map((game) => ({
        id: game._id,
        sessionId: game.sessionId, // Vérifiez si c'est peuplé
        salePrice: game.salePrice,
        sold: game.sold,
      }))
    );
  
    return depositedGames;
  }

  async findGamesBySessionId(sessionId: string): Promise<DepositedGame[]> {
    const depositedGames = await this.depositedGameModel
      .find({ sessionId })
      .exec();
  
    return depositedGames;
  }

  async findAllWithSessions(): Promise<DepositedGame[]> {
    return this.depositedGameModel
      .find()
      .populate('sessionId', 'name startDate endDate') // Inclure startDate et endDate pour éviter les sessions incomplètes
      .populate('sellerId', 'name email') // Peupler le vendeur pour valider son association
      .exec();
  }
  
  
  
}
