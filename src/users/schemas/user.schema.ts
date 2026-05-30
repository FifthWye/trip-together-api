import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true }) email: string;
  @Prop() passwordHash?: string;
  @Prop() googleId?: string;
  @Prop({ default: 'email' }) authProvider?: 'email' | 'google';
  @Prop() name?: string;
  @Prop() avatarUrl?: string;
  @Prop() bio?: string;
  @Prop() location?: string;
  @Prop([String]) travelStyles?: string[];
  @Prop([String]) dietaryPreferences?: string[];
  @Prop() typicalBudget?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
