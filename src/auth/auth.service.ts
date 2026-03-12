import bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schema/users.schema';
import { UserService, UserWithoutPassword } from 'src/user/user.service';
import type {
  LoginUserDTO,
  RegisterUserDTO,
  CheckSessionDTO,
  RefreshAccessTokenDTO
} from './dto/register-user.dto';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly userService: UserService
  ) { }

  async signUpWithEmail(registerUserDTO: RegisterUserDTO) {
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

  async signInWithEmail(loginUserDTO: LoginUserDTO) {
    const identifier = loginUserDTO.email.trim().toLowerCase();
    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDTO.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { id: user._id.toString(), email: user.email };
    const accessToken = await this.userService.generateAccessToken(payload);
    const refreshToken = await this.userService.generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    const { password, ...userObject } = user.toObject({ versionKey: false });

    return { user: userObject as UserWithoutPassword, accessToken, refreshToken };
  }

  async checkSession(dto: CheckSessionDTO) {
    try {
      const payload = await this.userService.verifyAccessToken(dto.accessToken);
      const user = await this.userService.getUserById(payload.id);

      if (!user) {
        throw new UnauthorizedException('Session invalid. User not found.');
      }

      return { user };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  async refreshAccessToken(dto: RefreshAccessTokenDTO) {
    try {
      const payload = await this.userService.verifyRefreshToken(dto.refreshToken);
      const user = await this.userService.getUserById(payload.id);

      // Verify that this user exists and has a matching refreshToken in DB.
      // NOTE: Because lean() returns the full object minus excluded fields, user has the refreshToken.
      if (!user || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const newAccessToken = await this.userService.generateAccessToken({ id: user._id.toString(), email: user.email });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
