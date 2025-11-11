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
import { CurrentUser } from '../common/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private trips: TripsService) {}

  // GET /api/trips
  @Get()
  listAll() {
    return this.trips.listForAll();
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

  // GET /api/trips/:id
  @Get(':id')
  get(@Param('id') id: string) {
    return this.trips.get(id);
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
  addDate(@Param('id') id: string, @Body() dto: AddDateDto) {
    return this.trips.addDate(id, dto.start, dto.end);
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
}
