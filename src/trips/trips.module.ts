import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trip, TripSchema } from './schemas/trip.schema';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { PublicTripsController } from './public-trips.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }]),
  ],
  controllers: [PublicTripsController, TripsController],
  providers: [TripsService],
})
export class TripsModule {}
