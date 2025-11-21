import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  registerUser() {
    return { message: 'Registered user successfully!' };
  }
}
