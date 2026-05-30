import { IsString, IsOptional } from 'class-validator';

export class AddItemDto {
  @IsString() name: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() placeId?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() location?: { lat: number; lng: number };
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() estimatedPrice?: string;
}
