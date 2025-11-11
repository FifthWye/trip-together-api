import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trip, TripSchema } from './schemas/trip.schema';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }])],
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
