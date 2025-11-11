import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TripDocument = HydratedDocument<Trip>;

class Vote {
  @Prop({ type: [String], default: [] }) up: string[]; // user ids who voted up
  @Prop({ type: [String], default: [] }) down: string[];
}
const VoteSchema = SchemaFactory.createForClass(Vote);

@Schema({ _id: false })
class DateOption {
  @Prop({ required: true }) start: string; // ISO date
  @Prop({ required: true }) end: string; // ISO date
  @Prop({ type: VoteSchema, default: {} }) votes: Vote;
}
const DateOptionSchema = SchemaFactory.createForClass(DateOption);

@Schema({ _id: false })
class ItemOption {
  @Prop({ required: true }) name: string;
  @Prop() url?: string;
  @Prop({ type: VoteSchema, default: {} }) votes: Vote;
}
const ItemOptionSchema = SchemaFactory.createForClass(ItemOption);

@Schema({ timestamps: true })
export class Trip {
  @Prop({ required: true }) title: string;
  @Prop() description?: string;
  @Prop({ type: [String], default: [] }) members: string[]; // user ids
  @Prop({ type: [DateOptionSchema], default: [] }) dates: DateOption[];
  @Prop({ type: [ItemOptionSchema], default: [] }) accommodations: any[];
  @Prop({ type: [ItemOptionSchema], default: [] }) places: any[];
  @Prop({ type: [ItemOptionSchema], default: [] }) restaurants: any[];
  @Prop() shareCode?: string; // for /share semantics
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;
}
export const TripSchema = SchemaFactory.createForClass(Trip);
