import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller } from '../schemas/seller.schema';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';

@Injectable()
export class SellerService {
  constructor(@InjectModel(Seller.name) private sellerModel: Model<Seller>) {}

  async create(createSellerDto: CreateSellerDto): Promise<Seller> {
    const existingSeller = await this.sellerModel.findOne({ email: createSellerDto.email }).exec();
    if (existingSeller) {
      throw new ConflictException('Email already exists');
    }
    const createdSeller = new this.sellerModel(createSellerDto);
    return createdSeller.save();
  }

  async findAll(): Promise<Seller[]> {
    return this.sellerModel.find().exec();
  }

  async findBySessionId(sessionId: String) {
    const sellers = await this.sellerModel
      .find({ sessionId })
      .exec();
  
    return sellers;
  } 

  async findOne(id: string): Promise<Seller> {
    return this.sellerModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<Seller> {
    const seller = await this.sellerModel.findOne({ email }).exec();
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    return seller;
  }

  async update(id: string, updateSellerDto: UpdateSellerDto): Promise<Seller> {
    if (updateSellerDto.email) {
      const existingSeller = await this.sellerModel.findOne({ email: updateSellerDto.email }).exec();
      if (existingSeller && existingSeller._id.toString() !== id) {
        throw new ConflictException('Email already exists');
      }
    }
    const updatedSeller = await this.sellerModel.findByIdAndUpdate(id, updateSellerDto, { new: true }).exec();
    if (!updatedSeller) {
      throw new NotFoundException('Seller not found');
    }
    return updatedSeller;
  }

  async updateByEmail(email: string, updateSellerDto: UpdateSellerDto): Promise<Seller> {
    const existingSeller = await this.sellerModel.findOne({ email }).exec();
    if (!existingSeller) {
      throw new NotFoundException('Seller not found');
    }

    // Vérifier l'unicité de l'email si elle est modifiée
    if (updateSellerDto.email && updateSellerDto.email !== email) {
      const emailConflict = await this.sellerModel.findOne({ email: updateSellerDto.email }).exec();
      if (emailConflict) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(existingSeller, updateSellerDto);
    return existingSeller.save();
  }

  async remove(id: string): Promise<Seller> {
    const deletedSeller = await this.sellerModel.findByIdAndDelete(id).exec();
    if (!deletedSeller) {
      throw new NotFoundException('Seller not found');
    }
    return deletedSeller;
  }

  async removeByEmail(email: string): Promise<Seller> {
    const deletedSeller = await this.sellerModel.findOneAndDelete({ email }).exec();
    if (!deletedSeller) {
      throw new NotFoundException('Seller not found');
    }
    return deletedSeller;
  }
}
