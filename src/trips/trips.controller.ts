import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AddDateDto } from './dto/add-date.dto';
import { AddItemDto } from './dto/add-item.dto';
import { CurrentUser } from '../common/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private trips: TripsService) {}

  // GET /api/trips
  @Get()
  listAll(@CurrentUser() user) {
    return this.trips.listForUser(user.sub);
  }

  // GET /api/trips/user
  @Get('user')
  listMine(@CurrentUser() user) {
    return this.trips.listForUser(user.sub);
  }

  // POST /api/trips
  @Post()
  create(@Body() dto: CreateTripDto, @CurrentUser() user) {
    return this.trips.create(user.sub, dto);
  }

  // GET /api/trips/:id/activity
  @Get(':id/activity')
  getActivity(@Param('id') id: string, @CurrentUser() user) {
    return this.trips.getActivity(id, user.sub);
  }

  // GET /api/trips/:id
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user) {
    return this.trips.getForUser(id, user.sub);
  }

  // PATCH /api/trips/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
    @CurrentUser() user,
  ) {
    return this.trips.update(id, user.sub, dto);
  }

  // DELETE /api/trips/:id
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.trips.remove(id, user.sub);
  }

  // POST /api/trips/:id/join
  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user) {
    return this.trips.join(id, user.sub);
  }

  // POST /api/trips/:id/dates
  @Post(':id/dates')
  addDate(@Param('id') id: string, @Body() dto: AddDateDto, @CurrentUser() user) {
    return this.trips.addDate(id, user.sub, dto.start, dto.end);
  }

  // PATCH /api/trips/:id/dates/vote?index=0&kind=up
  @Patch(':id/dates/vote')
  voteDate(
    @Param('id') id: string,
    @Query('index') index: string,
    @Query('kind') kind: 'up' | 'down',
    @CurrentUser() user,
  ) {
    return this.trips.voteDate(id, Number(index), user.sub, kind);
  }

  // POST /api/trips/:id/items?category=accommodations|places|restaurants
  @Post(':id/items')
  addItem(
    @Param('id') id: string,
    @Query('category') category: 'accommodations' | 'places' | 'restaurants',
    @Body() dto: AddItemDto,
    @CurrentUser() user,
  ) {
    return this.trips.addItem(id, user.sub, category, dto);
  }

  // PATCH /api/trips/:id/items/:category/:index
  @Patch(':id/items/:category/:index')
  updateItem(
    @Param('id') id: string,
    @Param('category') category: 'accommodations' | 'places' | 'restaurants',
    @Param('index') index: string,
    @Body() dto: AddItemDto,
    @CurrentUser() user,
  ) {
    return this.trips.updateItem(id, user.sub, category, Number(index), dto);
  }

  // DELETE /api/trips/:id/items/:category/:index
  @Delete(':id/items/:category/:index')
  removeItem(
    @Param('id') id: string,
    @Param('category') category: 'accommodations' | 'places' | 'restaurants',
    @Param('index') index: string,
    @CurrentUser() user,
  ) {
    return this.trips.removeItem(id, user.sub, category, Number(index));
  }

  // PATCH /api/trips/:id/items/vote?category=accommodations&index=0&kind=up
  @Patch(':id/items/vote')
  voteItem(
    @Param('id') id: string,
    @Query('category') category: 'accommodations' | 'places' | 'restaurants',
    @Query('index') index: string,
    @Query('kind') kind: 'up' | 'down',
    @CurrentUser() user,
  ) {
    return this.trips.voteItem(id, category, Number(index), user.sub, kind || 'up');
  }

  // PATCH /api/trips/:id/dates/finalize?index=0
  @Patch(':id/dates/finalize')
  finalizeDates(
    @Param('id') id: string,
    @Query('index') index: string,
    @CurrentUser() user,
  ) {
    return this.trips.finalizeDates(id, user.sub, Number(index));
  }

  // PATCH /api/trips/:id/items/finalize?category=accommodations&index=0
  @Patch(':id/items/finalize')
  finalizeItem(
    @Param('id') id: string,
    @Query('category') category: 'accommodations' | 'places' | 'restaurants',
    @Query('index') index: string,
    @CurrentUser() user,
  ) {
    return this.trips.finalizeItem(id, user.sub, category, Number(index));
  }

  // POST /api/trips/:id/share
  @Post(':id/share')
  generateShareCode(@Param('id') id: string, @CurrentUser() user) {
    return this.trips.generateShareCode(id, user.sub);
  }
}
