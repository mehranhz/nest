import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { promisify } from 'util';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { User } from './user.entity';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async signup(body: CreateUserDto) {
    const users = await this.userService.find({
      email: body.email,
    });

    if (users.length > 0) {
      throw new BadRequestException('User with this email already exists');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(body.password, salt, 32)) as Buffer;
    const password = [salt, hash.toString('hex')].join('.');

    return this.userService.createUser(body.email, password);
  }

  async signin(email: string, password: string): Promise<User> {
    const [user] = await this.userService.find({ email });

    if (!user) {
      throw new NotFoundException('Useree not found!');
    }

    const [salt, userPasswordHash] = user.password.split('.');

    if (
      ((await scrypt(password, salt, 32)) as Buffer).toString('hex') !==
      userPasswordHash
    ) {
      throw new UnauthorizedException(
        'There is no user with prvided credentials!',
      );
    }

    return user;
  }
}
