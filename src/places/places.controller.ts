import { Controller, Get, Query } from '@nestjs/common';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('autocomplete')
  async getAutocomplete(
    @Query('input') input: string,
    @Query('types') types?: string,
  ) {
    if (!input || input.trim().length < 2) {
      return {
        status: 'INVALID_REQUEST',
        predictions: [],
      };
    }
    return await this.placesService.getAutocomplete(input.trim(), types);
  }

  @Get('details')
  async getPlaceDetails(@Query('place_id') placeId: string) {
    if (!placeId) {
      return {
        status: 'INVALID_REQUEST',
        result: null,
      };
    }
    return await this.placesService.getPlaceDetails(placeId);
  }
}

