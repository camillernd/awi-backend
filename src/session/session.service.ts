//session.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session } from '../schemas/session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { DepositedGameService } from '../depositedGame/depositedGame.service'; 

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private depositedGameService: DepositedGameService, // Injection du service DepositedGame
  ) {}
  // Helper pour valider les dates
  private validateDates(startDate: Date, endDate: Date): void {
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début.');
    }
  }

  /**
     * Crée une nouvelle session dans la base de données.
     * 
     * @param createSessionDto - Les données nécessaires pour créer une session, incluant :
     *   - `name`: Le nom unique de la session.
     *   - `startDate`: La date de début de la session.
     *   - `endDate`: La date de fin de la session.
     * @returns La session créée sous forme d'objet `Session`.
     * 
     * @throws ConflictException - Si le nom de la session existe déjà ou si les dates de la session
     *   chevauchent une autre session existante.
     */
  async create(createSessionDto: CreateSessionDto): Promise<Session> {
    // Valide les dates
    this.validateDates(createSessionDto.startDate, createSessionDto.endDate);

    // Vérifie l'unicité du nom de la session
    const existingSession = await this.sessionModel.findOne({ name: createSessionDto.name }).exec();
    if (existingSession) {
      throw new ConflictException('Le nom de session existe déjà.');
    }

    // Vérifie les chevauchements de dates
    const overlappingSession = await this.sessionModel.findOne({
      $or: [
        { startDate: { $lt: createSessionDto.endDate }, endDate: { $gt: createSessionDto.startDate } },
      ],
    }).exec();
    if (overlappingSession) {
      throw new ConflictException('Les dates de session chevauchent une session existante.');
    }

    // Crée la session
    const createdSession = new this.sessionModel(createSessionDto);
    return createdSession.save();
  }

  async findAll(): Promise<Session[]> {
    return this.sessionModel.find().sort({ startDate: -1 }).exec();
  }

  async findOne(id: string): Promise<Session> {
    return this.sessionModel.findById(id).exec();
  }

  async findByName(name: string): Promise<Session> {
    const session = await this.sessionModel.findOne({ name }).exec();
    if (!session) {
      throw new NotFoundException('Session non trouvée.');
    }
    return session;
    }

  async update(id: string, updateSessionDto: UpdateSessionDto): Promise<Session> {
    // Vérifie les dates si elles sont mises à jour
    if (updateSessionDto.startDate && updateSessionDto.endDate) {
      this.validateDates(updateSessionDto.startDate, updateSessionDto.endDate);
    }

    // Vérifie l'unicité du nom de session
    if (updateSessionDto.name) {
      const existingSession = await this.sessionModel.findOne({ name: updateSessionDto.name }).exec();
      if (existingSession && existingSession._id.toString() !== id) {
        throw new ConflictException('Le nom de session existe déjà.');
      }
    }

    // Met à jour la session
    const updatedSession = await this.sessionModel.findByIdAndUpdate(id, updateSessionDto, { new: true }).exec();
    if (!updatedSession) {
      throw new NotFoundException('Session non trouvée.');
    }
    return updatedSession;
  }

  async updateByName(name: string, updateSessionDto: UpdateSessionDto): Promise<Session> {
    const existingSession = await this.findByName(name);
    if (!existingSession) {
      throw new NotFoundException('Session non trouvée.');
    }

    // Vérifie les dates si elles sont mises à jour
    if (updateSessionDto.startDate && updateSessionDto.endDate) {
      this.validateDates(updateSessionDto.startDate, updateSessionDto.endDate);
    }

    // Met à jour la session
    const updatedSession = await this.sessionModel.findOneAndUpdate(
      { name },
      updateSessionDto,
      { new: true },
    ).exec();

    if (!updatedSession) {
      throw new NotFoundException('Session non trouvée.');
    }

    return updatedSession;
  }

  async remove(id: string): Promise<Session> {
    const deletedSession = await this.sessionModel.findByIdAndDelete(id).exec();
    if (!deletedSession) {
      throw new NotFoundException('Session non trouvée.');
    }
    return deletedSession;
  }

  async removeByName(name: string): Promise<Session> {
    const deletedSession = await this.sessionModel.findOneAndDelete({ name }).exec();
    if (!deletedSession) {
      throw new NotFoundException('Session non trouvée.');
    }
    return deletedSession;
  }

  async getSessionReport(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Appel au service DepositedGame pour récupérer les jeux déposés
    const depositedGames = await this.depositedGameService.findBySessionId(sessionId);

    const totalGames = depositedGames.length;

    const soldGames = depositedGames.filter((game) => game.sold).length;

    const totalRevenusVentesAvantComission = depositedGames.reduce((sum, game) => {
      return game.sold ? sum + game.salePrice : sum;
    }, 0);
    
    const totalCommissionsEncaissees = depositedGames.reduce((sum, game) => {
      if (game.sold && typeof game.salePrice === 'number' && game.sessionId) {
        const session = game.sessionId as { saleComission?: number };
        console.log('comission du depositedgame :', session.saleComission);
        if (session.saleComission !== undefined) {
          return sum + game.salePrice * (session.saleComission / 100);
        }
      }
      return sum;
    }, 0);
    
    console.log('Total des commissions encaissées :', totalCommissionsEncaissees);
    

    return {
      sessionName: session.name,
      totalGames,
      soldGames,
      totalRevenusVentesAvantComission,
      totalCommissionsEncaissees,
    };
  }

  //SARAH : cette méthode donnait toutes les sessions sauf les fermée (donc meme les à venir)
  //il me fallait une méthode qui donne QUE la session ouverte
  //ajout de : endDate: { $gt: today } c'est tout
  async findActiveSessions(): Promise<Session[]> {
    const today = new Date();
    const sessions = await this.sessionModel.find({startDate: { $lte: today }, endDate: { $gt: today } }).exec();
    console.log('Sessions actives récupérées:', sessions);
    return sessions;
  }

  async isOpened(sessionId: string): Promise<boolean> {
    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    const today = new Date();
    return today >= session.startDate && today <= session.endDate;
  }
  
  async getOpenSession(): Promise<Session> {
    const today = new Date();
    const openSession = await this.sessionModel.findOne({
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).exec();
  
    if (!openSession) {
      throw new NotFoundException('Aucune session ouverte disponible.');
    }
    return openSession;
  }

  async hasDepositedGames(sessionId: string): Promise<boolean> {
    const depositedGames = await this.depositedGameService.findBySessionId(sessionId);
    return depositedGames.length > 0;
  }

}
