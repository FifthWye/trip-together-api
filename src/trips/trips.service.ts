import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Trip, TripDocument } from './schemas/trip.schema';
import { Model, Types } from 'mongoose';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(@InjectModel(Trip.name) private trips: Model<TripDocument>) {}

  listForAll() {
    return this.trips.find().lean();
  }
  listForUser(userId: string) {
    return this.trips.find({ members: userId }).lean();
  }

  async create(ownerId: string, dto: CreateTripDto) {
    const trip = await this.trips.create({
      owner: new Types.ObjectId(ownerId),
      title: dto.title,
      description: dto.description,
      members: [new Types.ObjectId(ownerId)],
    });
    return trip.toObject();
  }

  async get(id: string) {
    const t = await this.trips
      .findById(id)
      .populate('owner', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl')
      .lean();
    if (!t) throw new NotFoundException();
    return t;
  }

  async update(id: string, userId: string, dto: UpdateTripDto) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    if (t.owner.toString() !== userId) throw new ForbiddenException();
    Object.assign(t, dto);
    await t.save();
    return t.toObject();
  }

  async remove(id: string, userId: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    if (t.owner.toString() !== userId) throw new ForbiddenException();
    await t.deleteOne();
    return { ok: true };
  }

  async join(id: string, userId: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    const oid = new Types.ObjectId(userId);
    if (!t.members.some(m => m.toString() === userId)) {
         t.members.push(oid);
    }
    await t.save();
    return t.toObject();
  }

  async addDate(id: string, start: string, end: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    // Explicitly create the votes object with up/down arrays to avoid schema issues
    t.dates.push({ 
      start, 
      end, 
      votes: { up: [], down: [] } 
    } as any);
    await t.save();
    return t.toObject();
  }

  async voteDate(
    id: string,
    index: number,
    userId: string,
    kind: 'up' | 'down',
  ) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    
    // Robustly handle votes object (handle potential Mongoose subdoc or plain obj)
    // We convert to POJO, modify, and re-assign to ensure Mongoose detects the change
    // Using JSON parse/stringify is a safe way to deep clone and detach from Mongoose tracking
    const opt = t.dates[index];
    if (!opt) throw new NotFoundException('date option not found');

    // Initialize votes if missing
    if (!opt.votes) {
      opt.votes = { up: [], down: [] } as any;
    }
    if (!opt.votes.up) opt.votes.up = [];
    if (!opt.votes.down) opt.votes.down = [];

    // Check current vote status
    const upIndex = opt.votes.up.indexOf(userId);
    const downIndex = opt.votes.down.indexOf(userId);
    
    // Check if user already voted for this type (for toggle behavior)
    const alreadyVotedThisWay = (kind === 'up' && upIndex > -1) || (kind === 'down' && downIndex > -1);
    
    // Remove user from both arrays
    if (upIndex > -1) opt.votes.up.splice(upIndex, 1);
    if (downIndex > -1) opt.votes.down.splice(downIndex, 1);

    // Only add back if they weren't already voting this way (toggle behavior)
    if (!alreadyVotedThisWay) {
      if (kind === 'up') {
        opt.votes.up.push(userId);
      } else {
        opt.votes.down.push(userId);
      }
    }
    
    // Mongoose might not detect deep changes in mixed types/arrays sometimes, mark modify
    t.markModified('dates');

    await t.save();
    
    // Return fully populated trip so frontend state (members, etc.) doesn't break
    const updated = await this.get(id);
    
    return updated;
  }
}
