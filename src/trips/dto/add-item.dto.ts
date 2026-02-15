import { IsString, IsOptional, IsUrl } from 'class-validator';

export class AddItemDto {
  @IsString() name: string;
  @IsOptional() @IsString() url?: string;
}
