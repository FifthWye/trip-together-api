import { IsOptional, IsString } from 'class-validator';
export class CreateTripDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
}
