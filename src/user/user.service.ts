import { Injectable } from '@nestjs/common';
import { RegisterUserDTO } from 'src/auth/dto/register-user.dto';

@Injectable()
export class UserService {
  createUser(registerUserDTO: RegisterUserDTO) {
    return { message: 'User created successfuully!' };
  }
}
