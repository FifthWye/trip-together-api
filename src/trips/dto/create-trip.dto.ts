import { IsArray, IsOptional, IsString } from 'class-validator';
export class CreateTripDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) locations?: string[];
  @IsOptional() @IsString() budget?: string;
}
