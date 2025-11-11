import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Trip, TripDocument } from './schemas/trip.schema';
import { Model, Types } from 'mongoose';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(@InjectModel(Trip.name) private trips: Model<TripDocument>) {}

  listForAll() { return this.trips.find().lean(); }
  listForUser(userId: string) { return this.trips.find({ members: userId }).lean(); }

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

  async voteDate(id: string, index: number, userId: string, kind: 'up'|'down') {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    const opt = t.dates[index];
    if (!opt) throw new NotFoundException('date option not found');

    // remove from both then add to selected
    opt.votes.up = opt.votes.up.filter(u => u !== userId);
    opt.votes.down = opt.votes.down.filter(u => u !== userId);
    (opt.votes as any)[kind].push(userId);

    await t.save();
    return t.toObject();
  }
}
