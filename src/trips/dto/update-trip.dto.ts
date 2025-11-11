import { IsOptional, IsString } from 'class-validator';
export class UpdateTripDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
}
