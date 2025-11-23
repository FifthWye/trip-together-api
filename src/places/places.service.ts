import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PlacesService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');
    if (!this.apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY not configured');
    }
  }

  async getAutocomplete(input: string) {
    if (!this.apiKey) {
      throw new HttpException(
        'Google Places API key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await axios.get(`${this.baseUrl}/autocomplete/json`, {
        params: {
          input,
          key: this.apiKey,
        },
      });

      // Forward Google's response, but handle errors appropriately
      if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
        return response.data;
      }

      // Handle other statuses from Google API
      if (response.data.status === 'INVALID_REQUEST') {
        throw new HttpException(
          {
            status: 'INVALID_REQUEST',
            error: response.data.error_message || 'Invalid request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (response.data.status === 'REQUEST_DENIED') {
        throw new HttpException(
          {
            status: 'REQUEST_DENIED',
            error: response.data.error_message || 'Request denied',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // For other error statuses
      throw new HttpException(
        {
          status: response.data.status,
          error: response.data.error_message || 'Failed to fetch place predictions',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Google Places Autocomplete error:', error);
      throw new HttpException(
        {
          status: 'ERROR',
          error: 'Failed to fetch place predictions',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPlaceDetails(placeId: string) {
    if (!this.apiKey) {
      throw new HttpException(
        'Google Places API key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'place_id,name,formatted_address,geometry',
        },
      });

      // Forward Google's response, but handle errors appropriately
      if (response.data.status === 'OK') {
        return response.data;
      }

      // Handle other statuses from Google API
      if (response.data.status === 'INVALID_REQUEST') {
        throw new HttpException(
          {
            status: 'INVALID_REQUEST',
            error: response.data.error_message || 'Invalid request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (response.data.status === 'NOT_FOUND') {
        throw new HttpException(
          {
            status: 'NOT_FOUND',
            error: response.data.error_message || 'Place not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (response.data.status === 'REQUEST_DENIED') {
        throw new HttpException(
          {
            status: 'REQUEST_DENIED',
            error: response.data.error_message || 'Request denied',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // For other error statuses
      throw new HttpException(
        {
          status: response.data.status,
          error: response.data.error_message || 'Failed to fetch place details',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Google Places Details error:', error);
      throw new HttpException(
        {
          status: 'ERROR',
          error: 'Failed to fetch place details',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

