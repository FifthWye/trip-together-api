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
import { AddItemDto } from './dto/add-item.dto';
import { randomBytes } from 'crypto';

type ItemCategory = 'accommodations' | 'places' | 'restaurants';
type VoteKind = 'up' | 'down';

@Injectable()
export class TripsService {
  constructor(@InjectModel(Trip.name) private trips: Model<TripDocument>) {}

  listForUser(userId: string) {
    return this.trips.find({ members: userId }).sort({ updatedAt: -1 }).lean();
  }

  async create(ownerId: string, dto: CreateTripDto) {
    const trip = await this.trips.create({
      owner: new Types.ObjectId(ownerId),
      title: dto.title,
      description: dto.description,
      locations: dto.locations || [],
      budget: dto.budget,
      members: [new Types.ObjectId(ownerId)],
      activity: [
        {
          type: 'trip_created',
          message: 'Trip created',
          actor: new Types.ObjectId(ownerId),
        },
      ],
    });
    return this.getForUser(trip._id.toString(), ownerId);
  }

  async getForUser(id: string, userId: string) {
    const t = await this.findPopulated(id);
    this.assertMember(t, userId);
    return t;
  }

  async update(id: string, userId: string, dto: UpdateTripDto) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertOwner(t, userId);

    Object.assign(t, dto);
    this.addActivity(t, {
      type: 'trip_updated',
      message: 'Trip details updated',
      actor: userId,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async remove(id: string, userId: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertOwner(t, userId);
    await t.deleteOne();
    return { ok: true };
  }

  async join(id: string, userId: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();

    if (!this.isMember(t, userId)) {
      t.members.push(new Types.ObjectId(userId));
      this.addActivity(t, {
        type: 'member_joined',
        message: 'A traveler joined the trip',
        actor: userId,
      });
      await t.save();
    }
    return this.getForUser(id, userId);
  }

  async addDate(id: string, userId: string, start: string, end: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertMember(t, userId);
    if (new Date(start) > new Date(end)) {
      throw new BadRequestException('Start date must be before end date');
    }

    t.dates.push({ start, end, votes: { up: [], down: [] } } as any);
    this.addActivity(t, {
      type: 'date_added',
      message: 'A date option was added',
      actor: userId,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async voteDate(id: string, index: number, userId: string, kind: VoteKind) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertMember(t, userId);
    const opt = t.dates[index] as any;
    if (!opt) throw new NotFoundException('date option not found');

    this.toggleVote(opt, userId, kind);
    this.addActivity(t, {
      type: 'date_vote',
      message: 'A date vote was updated',
      actor: userId,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async addItem(
    id: string,
    userId: string,
    category: ItemCategory,
    dto: AddItemDto,
  ) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertMember(t, userId);

    t[category].push({
      ...dto,
      votes: { up: [], down: [] },
    } as any);
    this.addActivity(t, {
      type: 'item_added',
      message: `${this.categoryLabel(category)} option added`,
      actor: userId,
      category,
      itemName: dto.name,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async updateItem(
    id: string,
    userId: string,
    category: ItemCategory,
    index: number,
    dto: AddItemDto,
  ) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertMember(t, userId);
    const opt = t[category][index] as any;
    if (!opt) throw new NotFoundException('item option not found');

    Object.assign(opt, dto);
    this.addActivity(t, {
      type: 'item_updated',
      message: `${this.categoryLabel(category)} option updated`,
      actor: userId,
      category,
      itemName: opt.name,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async removeItem(
    id: string,
    userId: string,
    category: ItemCategory,
    index: number,
  ) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertMember(t, userId);
    const opt = t[category][index] as any;
    if (!opt) throw new NotFoundException('item option not found');

    t[category].splice(index, 1);
    this.addActivity(t, {
      type: 'item_removed',
      message: `${this.categoryLabel(category)} option removed`,
      actor: userId,
      category,
      itemName: opt.name,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async voteItem(
    id: string,
    category: ItemCategory,
    index: number,
    userId: string,
    kind: VoteKind = 'up',
  ) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertMember(t, userId);
    const opt = t[category][index] as any;
    if (!opt) throw new NotFoundException('item option not found');

    this.toggleVote(opt, userId, kind);
    this.addActivity(t, {
      type: 'item_vote',
      message: `${this.categoryLabel(category)} vote updated`,
      actor: userId,
      category,
      itemName: opt.name,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async finalizeDates(id: string, userId: string, index: number) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertOwner(t, userId);
    const opt = t.dates[index];
    if (!opt) throw new NotFoundException('date option not found');

    t.datesFinalized = true;
    t.finalized = { ...(t.finalized as any), dateIndex: index } as any;
    this.addActivity(t, {
      type: 'dates_finalized',
      message: 'Trip dates finalized',
      actor: userId,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async finalizeItem(
    id: string,
    userId: string,
    category: ItemCategory,
    index: number,
  ) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertOwner(t, userId);
    const opt = t[category][index] as any;
    if (!opt) throw new NotFoundException('item option not found');

    const finalized = { ...((t.finalized as any) || {}) };
    if (category === 'accommodations') finalized.accommodationIndex = index;
    if (category === 'places') finalized.placeIndexes = [index];
    if (category === 'restaurants') finalized.restaurantIndexes = [index];
    t.finalized = finalized as any;
    this.addActivity(t, {
      type: 'item_finalized',
      message: `${this.categoryLabel(category)} option finalized`,
      actor: userId,
      category,
      itemName: opt.name,
    });
    await t.save();
    return this.getForUser(id, userId);
  }

  async generateShareCode(id: string, userId: string) {
    const t = await this.trips.findById(id);
    if (!t) throw new NotFoundException();
    this.assertOwner(t, userId);

    if (!t.shareCode) {
      t.shareCode = randomBytes(4).toString('hex');
      this.addActivity(t, {
        type: 'share_link_created',
        message: 'Invite link created',
        actor: userId,
      });
      await t.save();
    }
    return { shareCode: t.shareCode };
  }

  async getByShareCode(code: string) {
    const t = await this.trips
      .findOne({ shareCode: code })
      .populate('owner', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl')
      .lean();
    if (!t) throw new NotFoundException('Trip not found');
    return t;
  }

  async getActivity(id: string, userId: string) {
    const t = await this.trips.findById(id).lean();
    if (!t) throw new NotFoundException();
    this.assertMember(t, userId);
    return { activity: (t.activity || []).slice().reverse() };
  }

  private async findPopulated(id: string) {
    const t = await this.trips
      .findById(id)
      .populate('owner', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl')
      .lean();
    if (!t) throw new NotFoundException();
    return t;
  }

  private isMember(trip: any, userId: string) {
    return (trip.members || []).some((member: any) => member.toString() === userId);
  }

  private assertMember(trip: any, userId: string) {
    if (!this.isMember(trip, userId)) throw new ForbiddenException();
  }

  private assertOwner(trip: any, userId: string) {
    if (trip.owner.toString() !== userId) throw new ForbiddenException();
  }

  private toggleVote(option: any, userId: string, kind: VoteKind) {
    option.votes ||= { up: [], down: [] };
    option.votes.up ||= [];
    option.votes.down ||= [];

    const upIndex = option.votes.up.indexOf(userId);
    const downIndex = option.votes.down.indexOf(userId);
    const alreadyVotedThisWay =
      (kind === 'up' && upIndex > -1) || (kind === 'down' && downIndex > -1);

    if (upIndex > -1) option.votes.up.splice(upIndex, 1);
    if (downIndex > -1) option.votes.down.splice(downIndex, 1);
    if (!alreadyVotedThisWay) option.votes[kind].push(userId);
  }

  private addActivity(
    trip: TripDocument,
    event: {
      type: string;
      message: string;
      actor?: string;
      category?: string;
      itemName?: string;
    },
  ) {
    trip.activity.push({
      ...event,
      actor: event.actor ? new Types.ObjectId(event.actor) : undefined,
      createdAt: new Date(),
    } as any);
  }

  private categoryLabel(category: ItemCategory) {
    if (category === 'accommodations') return 'Stay';
    if (category === 'restaurants') return 'Food';
    return 'Place';
  }
}
