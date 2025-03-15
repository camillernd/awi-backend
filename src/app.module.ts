import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ManagerController } from './manager/manager.controller';
import { ManagerService } from './manager/manager.service';
import { Manager, ManagerSchema } from './schemas/manager.schema';
import { ManagerModule } from './manager/manager.module';
import { AuthModule } from './auth/auth.module';
import { GameDescriptionModule } from './gameDescription/gameDescription.module';
import { SellerModule } from './seller/seller.module';
import { SessionModule } from './session/session.module';
import { DepositedGameModule } from './depositedGame/depositedGame.module';
import { DepositFeePaymentModule } from './depositFeePayment/depositFeePayment.module';
import { ClientModule } from './client/client.module'; // Import du ClientModule
import * as dotenv from 'dotenv';
import { RefundModule } from './refund/refund.module';
import { TransactionModule } from './transaction/transaction.module';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeature([{ name: Manager.name, schema: ManagerSchema }]),
    AuthModule,
    ManagerModule,
    GameDescriptionModule,
    SellerModule,
    SessionModule,
    DepositedGameModule,
    DepositFeePaymentModule,
    RefundModule,
    ClientModule,
    TransactionModule,
  ],
  controllers: [
    ManagerController,
    AppController,
  ],
  providers: [
    ManagerService,
    AppService,
  ],
})
export class AppModule {
}
