import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TripDocument = HydratedDocument<Trip>;

@Schema({ _id: false })
class Vote {
  @Prop({ type: [String], default: [] }) up: string[];
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
  @Prop() placeId?: string;
  @Prop() address?: string;
  @Prop({ type: { lat: Number, lng: Number }, _id: false }) location?: {
    lat: number;
    lng: number;
  };
  @Prop() imageUrl?: string;
  @Prop() notes?: string;
  @Prop() estimatedPrice?: string;
  @Prop({ type: VoteSchema, default: () => ({ up: [], down: [] }) }) votes: Vote;
}
const ItemOptionSchema = SchemaFactory.createForClass(ItemOption);

@Schema({ _id: false })
class FinalizedOptions {
  @Prop() dateIndex?: number;
  @Prop() accommodationIndex?: number;
  @Prop({ type: [Number], default: [] }) placeIndexes?: number[];
  @Prop({ type: [Number], default: [] }) restaurantIndexes?: number[];
}
const FinalizedOptionsSchema = SchemaFactory.createForClass(FinalizedOptions);

@Schema({ _id: false, timestamps: false })
class ActivityEvent {
  @Prop({ required: true }) type: string;
  @Prop({ required: true }) message: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) actor?: Types.ObjectId;
  @Prop() category?: string;
  @Prop() itemName?: string;
  @Prop({ default: () => new Date() }) createdAt: Date;
}
const ActivityEventSchema = SchemaFactory.createForClass(ActivityEvent);

@Schema({ timestamps: true })
export class Trip {
  @Prop({ required: true }) title: string;
  @Prop() description?: string;
  @Prop({ type: [String], default: [] }) locations: string[];
  @Prop() budget?: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] }) members: Types.ObjectId[];
  @Prop({ type: [DateOptionSchema], default: [] }) dates: DateOption[];
  @Prop({ type: [ItemOptionSchema], default: [] }) accommodations: any[];
  @Prop({ type: [ItemOptionSchema], default: [] }) places: any[];
  @Prop({ type: [ItemOptionSchema], default: [] }) restaurants: any[];
  @Prop() shareCode?: string; // for /share semantics
  @Prop({ default: false }) datesFinalized: boolean;
  @Prop({ type: FinalizedOptionsSchema, default: () => ({}) })
  finalized: FinalizedOptions;
  @Prop({ type: [ActivityEventSchema], default: [] }) activity: ActivityEvent[];
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;
}
export const TripSchema = SchemaFactory.createForClass(Trip);
