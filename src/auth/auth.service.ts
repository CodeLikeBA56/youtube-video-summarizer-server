import bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterUserDTO } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async registerUser(registerUserDTO: RegisterUserDTO) {
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(
      registerUserDTO.password,
      saltRounds,
    );

    const result = await this.userService.createUser({
      ...registerUserDTO,
      password: hashedPassword,
    });

    return { message: 'Account registered successfully!', ...result };
  }
}
