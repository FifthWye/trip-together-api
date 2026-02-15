import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Trip, TripDocument } from './schemas/trip.schema';
import { Model, Types } from 'mongoose';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { randomBytes } from 'crypto';

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
      members: [ownerId],
    });
    return trip.toObject();
  }

  async get(id: string) {
    const t = await this.trips.findById(id).lean();
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
    if (!t.members.includes(userId)) t.members.push(userId);
    await t.save();
    return t.toObject();
  }

  async addDate(id: string, start: string, end: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    t.dates.push({ start, end, votes: { up: [], down: [] } } as any);
    await t.save();
    return t.toObject();
  }

  async voteDate(
    id: string,
    index: number,
    userId: string,
    kind: 'up' | 'down',
  ) {
    const t = await this.trips.findById(id).lean();
    if (!t) throw new NotFoundException();
    const opt = t.dates[index];
    if (!opt) throw new NotFoundException('date option not found');

    // Initialize votes if missing (legacy data)
    if (!opt.votes) opt.votes = { up: [], down: [] };
    if (!opt.votes.up) opt.votes.up = [];
    if (!opt.votes.down) opt.votes.down = [];

    // Remove user from both arrays, then add to selected kind
    opt.votes.up = opt.votes.up.filter((u) => u !== userId);
    opt.votes.down = opt.votes.down.filter((u) => u !== userId);
    opt.votes[kind].push(userId);

    // Use $set on the specific date to ensure persistence
    const updated = await this.trips.findByIdAndUpdate(
      id,
      { $set: { [`dates.${index}.votes`]: opt.votes } },
      { new: true },
    ).lean();
    return updated;
  }

  async addItem(
    id: string,
    category: 'accommodations' | 'places' | 'restaurants',
    name: string,
    url?: string,
  ) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    t[category].push({ name, url, votes: { up: [], down: [] } } as any);
    await t.save();
    return t.toObject();
  }

  async voteItem(
    id: string,
    category: 'accommodations' | 'places' | 'restaurants',
    index: number,
    userId: string,
  ) {
    const t = await this.trips.findById(id).lean();
    if (!t) throw new NotFoundException();
    const opt = t[category][index];
    if (!opt) throw new NotFoundException('item option not found');

    // Initialize votes if missing (legacy data)
    if (!opt.votes) opt.votes = { up: [], down: [] };
    if (!opt.votes.up) opt.votes.up = [];

    // Toggle: if already voted, remove; otherwise add
    const idx = opt.votes.up.indexOf(userId);
    if (idx !== -1) {
      opt.votes.up.splice(idx, 1);
    } else {
      opt.votes.up.push(userId);
    }

    const updated = await this.trips.findByIdAndUpdate(
      id,
      { $set: { [`${category}.${index}.votes`]: opt.votes } },
      { new: true },
    ).lean();
    return updated;
  }

  async finalizeDates(id: string, userId: string, index: number) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    if (t.owner.toString() !== userId) throw new ForbiddenException();
    const opt = t.dates[index];
    if (!opt) throw new NotFoundException('date option not found');

    t.dates = [opt] as any;
    t.datesFinalized = true;
    await t.save();
    return t.toObject();
  }

  async generateShareCode(id: string, userId: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    if (t.owner.toString() !== userId) throw new ForbiddenException();

    if (!t.shareCode) {
      t.shareCode = randomBytes(4).toString('hex');
      await t.save();
    }
    return { shareCode: t.shareCode };
  }

  async getByShareCode(code: string) {
    const t = await this.trips.findOne({ shareCode: code }).lean();
    if (!t) throw new NotFoundException('Trip not found');
    return t;
  }
}
