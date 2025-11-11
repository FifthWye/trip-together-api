import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TripsModule } from './trips/trips.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        '.env.local',
        '.env.development',
        '.env.dev',
        '.env.production',
        '.env.prod',
      ],
      expandVariables: true,
    }),
    MongooseModule.forRoot(
      (process.env.MONGODB_URI as string) || 'mongodb://localhost:27017/trip-together',
    ),
    AuthModule,
    TripsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
