import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    MongooseModule.forRoot(process.env.MONGODB_URL as string),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
