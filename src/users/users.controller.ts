import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  NotFoundException,
  Patch,
  InternalServerErrorException,
  Delete,
  Session,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Serialize } from 'src/interceptors/serialize-interceptor';
import { UserDto } from './dtos/user.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import { User } from './user.entity';
import { AuthGuard } from 'src/guards/auth.guard';

@Serialize(UserDto)
// @UseInterceptors(CurrentUserInterceptor)
@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  // @Get('/me')
  // me(@Session() session: any) {
  //   console.log('userId is:', session.userId);
  //   return this.usersService.findOne(session.userId);
  // }

  @Get('/me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: User) {
    return user
  }

  @Post('/create')
  createUsesr(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body.email, body.password);
  }

  @Get('/:id')
  async getUser(@Param('id') id: number) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  @Patch('/:id')
  async updateUser(@Param('id') id: number, @Body() body: UpdateUserDto) {
    const user = await this.usersService.update(id, body);

    if (!user) {
      throw new InternalServerErrorException('Update failed');
    }

    return user;
  }

  @Delete('/:id')
  async deleteUser(@Param('id') id: number) {
    const user = await this.usersService.remove(id);

    if (!user) {
      throw new InternalServerErrorException('Failed to delete the user');

      return user;
    }
  }

  @Post('/signup')
  async signup(@Body() body: CreateUserDto, @Session() session: any) {
    const user = await this.authService.signup(body);

    session.userId = user.id;
    return user;
  }

  @Post('/signin')
  async signin(@Body() body: CreateUserDto, @Session() session: any) {
    const user = await this.authService.signin(body.email, body.password);

    session.userId = user.id;

    return user;
  }

  @Post('/signout')
  async signout(@Session() session: any) {
    session.userId = null;
  }
}
