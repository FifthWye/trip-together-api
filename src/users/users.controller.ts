import { Body, Controller, Get, Put, Request, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('profile')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Request() req) {
    const userId = req.user.sub;
    const user = await this.usersService.findById(userId);
    if (!user) {
        throw new NotFoundException('User not found');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateProfile(@Request() req, @Body() updateData: any) {
    // req.user is populated by JwtAuthGuard (from JwtStrategy)
    // The strategy returns { sub: userId, email: ... } 
    const userId = req.user.sub; 
    
    // Filter allowed fields to prevent overwriting sensitive data like passwordHash
    const allowedUpdates = {
      name: updateData.name,
      avatarUrl: updateData.avatarUrl,
      bio: updateData.bio,
      location: updateData.location,
      travelStyles: updateData.travelStyles,
      dietaryPreferences: updateData.dietaryPreferences,
      typicalBudget: updateData.typicalBudget,
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

    return this.usersService.updateProfile(userId, allowedUpdates);
  }
}
