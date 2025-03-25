import { Injectable, forwardRef, Inject, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ManagerService } from '../manager/manager.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => ManagerService))
    private managerService: ManagerService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valide les identifiants du manager
   * @param email Email du manager
   * @param pass Mot de passe du manager
   * @returns Le manager si les identifiants sont valides
   * @throws NotFoundException si l'email n'existe pas
   * @throws UnauthorizedException si le mot de passe est incorrect
   */
  async validateManager(email: string, pass: string): Promise<any> {
    if (!email || !pass) {
      throw new BadRequestException('Email et mot de passe sont requis');
    }

    const manager = await this.managerService.findOne({ email });

    if (!manager) {
      throw new NotFoundException('Aucun compte trouvé avec cet email');
    }

    const isMatched = await this.comparePasswords(pass, manager.password);

    if (!isMatched) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    return manager;
  }

  /**
   * Génère un token JWT après validation du login
   * @param loginDto Contient l'email et le mot de passe
   * @returns Un token JWT
   * @throws UnauthorizedException si les identifiants sont invalides
   */
  async generateJwtToken(loginDto: LoginDto): Promise<any> {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Email et mot de passe sont requis');
    }

    // Valide le manager avant de générer le token
    const manager = await this.validateManager(loginDto.email, loginDto.password);

    return { token:  this.jwtService.sign({ id: manager._id, email: manager.email }), isAdmin : manager.admin };
  }

  /**
   * Récupère le profil d'un manager par son ID
   * @param managerId ID du manager
   * @returns Les informations du manager sans le mot de passe
   */
  async getManagerProfileById(managerId: string): Promise<any> {
    const manager = await this.managerService.findOne({ _id: managerId });

    if (!manager) {
      throw new NotFoundException('Manager introuvable');
    }

    // Supprime le mot de passe de l'objet retourné
    const { password, ...safeData } = manager.toObject();
    return safeData;
  }

  /**
   * Hache un mot de passe avant stockage
   * @param password Mot de passe en clair
   * @returns Mot de passe haché
   */
  async getHashedPassword(password: string): Promise<string> {
    if (!password) {
      throw new BadRequestException('Le mot de passe est requis');
    }

    return bcrypt.hash(password, 10);
  }

  /**
   * Compare un mot de passe en clair avec un hash stocké
   * @param password Mot de passe en clair
   * @param hashedPassword Mot de passe haché
   * @returns True si les mots de passe correspondent, False sinon
   */
  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || !hashedPassword) {
      throw new BadRequestException('Les mots de passe sont requis pour la comparaison');
    }

    return bcrypt.compare(password, hashedPassword);
  }
}
