import bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schema/users.schema';
import { loginUserSchema } from './dto/register-user.dto';
import { UserService, UserWithoutPassword } from 'src/user/user.service';
import type { LoginUserDTO, RegisterUserDTO } from './dto/register-user.dto';
import { 
  Injectable, 
  BadRequestException,
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
    try {
      await loginUserSchema.parseAsync(loginUserDTO);
    } catch (error: any) {
      throw new BadRequestException('Invalid user data provided: ' + error.message);
    }

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

    const payload = { id: user._id, email: user.email };
    const accessToken = await this.userService.generateAccessToken(payload);
    const refreshToken = await this.userService.generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    const { password, ...userObject } = user.toObject({ versionKey: false });

    return { user: userObject as UserWithoutPassword, accessToken, refreshToken };
  }
}
