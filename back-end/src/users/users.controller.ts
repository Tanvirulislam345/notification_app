import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

/** Minimal user listing — lets the frontend's dev auth stub pick a user. */
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.findAll();
  }
}
