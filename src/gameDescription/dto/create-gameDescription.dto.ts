import { IsString, IsUrl, IsNotEmpty, IsNumber, IsEnum, Min} from 'class-validator';

//il faudra en ajouter d'autres !!
export enum AgeRange {
  VeryYoung = "0-5",
  Child = "5-10",
  Preteen = "8-12",
  Teen = "12-18",
  Adult = "18+", 
  Pegi3 = "3+",
  Pegi7 = "7+",
  Pegi12 = "12+",
  Pegi16 = "16+"
}

export class CreateGameDescriptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  publisher: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUrl()
  @IsNotEmpty()
  photoURL: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  minPlayers: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  maxPlayers: number;

  @IsEnum(AgeRange, { message: 'Invalid age range provided' })
  @IsNotEmpty()
  ageRange: AgeRange;
}
