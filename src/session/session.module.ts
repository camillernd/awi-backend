import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { Session, SessionSchema } from '../schemas/session.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }])],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [MongooseModule],
})
export class SessionModule {}
