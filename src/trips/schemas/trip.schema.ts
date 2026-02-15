import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TripDocument = HydratedDocument<Trip>;

@Schema({ _id: false })
class Vote {
  @Prop({ type: [String], default: [] }) up: string[]; // user ids who voted up
  @Prop({ type: [String], default: [] }) down: string[];
}
const VoteSchema = SchemaFactory.createForClass(Vote);


@Schema({ _id: false })
class DateOption {
  @Prop({ required: true }) start: string; // ISO date
  @Prop({ required: true }) end: string; // ISO date
  @Prop({ type: VoteSchema, default: () => ({ up: [], down: [] }) }) votes: Vote;
}
const DateOptionSchema = SchemaFactory.createForClass(DateOption);

@Schema({ _id: false })
class ItemOption {
  @Prop({ required: true }) name: string;
  @Prop() url?: string;
  @Prop({ type: VoteSchema, default: () => ({ up: [], down: [] }) }) votes: Vote;
}
const ItemOptionSchema = SchemaFactory.createForClass(ItemOption);

@Schema({ timestamps: true })
export class Trip {
  @Prop({ required: true }) title: string;
  @Prop() description?: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] }) members: Types.ObjectId[];
  @Prop({ type: [DateOptionSchema], default: [] }) dates: DateOption[];
  @Prop({ type: [ItemOptionSchema], default: [] }) accommodations: any[];
  @Prop({ type: [ItemOptionSchema], default: [] }) places: any[];
  @Prop({ type: [ItemOptionSchema], default: [] }) restaurants: any[];
  @Prop() shareCode?: string; // for /share semantics
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;
}
export const TripSchema = SchemaFactory.createForClass(Trip);
