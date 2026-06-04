import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { PreferencesService } from './preferences.service';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.preferences.getForUser(userId);
  }

  @Put(':userId')
  update(
    @Param('userId') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.preferences.update(userId, dto);
  }
}
