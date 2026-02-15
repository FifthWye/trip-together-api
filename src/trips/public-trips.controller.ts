import { Controller, Get, Param } from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')
export class PublicTripsController {
  constructor(private trips: TripsService) {}

  // GET /api/trips/share/:code (no auth required)
  @Get('share/:code')
  getByShareCode(@Param('code') code: string) {
    return this.trips.getByShareCode(code);
  }
}
