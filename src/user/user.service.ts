/* eslint-disable prettier/prettier */
import {
  Logger,
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from './schema/users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterUserDTO, registerUserSchema } from 'src/auth/dto/register-user.dto';
import { JwtService } from '@nestjs/jwt';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) { }

  private validateEmail(email: string): void {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required and cannot be empty.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new BadRequestException('The email format is invalid.');
    }
  }

  async createUser(registerUserDTO: RegisterUserDTO): Promise<{ user: UserWithoutPassword; accessToken: string; refreshToken: string }> {
    // Input validation with Zod
    try {
      await registerUserSchema.parseAsync(registerUserDTO);
    } catch (error: any) {
      throw new BadRequestException('Invalid user data provided: ' + error.message);
    }

    const email = registerUserDTO.email.trim().toLowerCase();
    let username = email.split('@')[0];

    // Check if email exists first
    const existingEmail = await this.userModel.findOne({ email });
    if (existingEmail) {
      throw new ConflictException('Email is already taken.');
    }

    // Ensure username is unique
    let usernameExists = await this.userModel.findOne({ username });
    while (usernameExists) {
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      username = `${email.split('@')[0]}_${randomSuffix}`;
      usernameExists = await this.userModel.findOne({ username });
    }

    try {
      // Create user
      const user = await this.userModel.create({
        username,
        name: registerUserDTO.name.trim(),
        email,
        password: registerUserDTO.password,
      });

      // Generate tokens
      const payload = { id: user._id, email: user.email };
      const accessToken = await this.generateAccessToken(payload);
      const refreshToken = await this.generateRefreshToken(payload);

      user.refreshToken = refreshToken;
      await user.save();

      // Remove password and version key from response
      const { password, ...userObject } = user.toObject({ versionKey: false });

      this.logger.log(`User created successfully: ${user.email}`);
      return { user: userObject as UserWithoutPassword, accessToken, refreshToken };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      this.logger.error(`Error creating user: ${errorMessage}`, error.stack);
      throw new InternalServerErrorException('Failed to create user. Please try again later.');
    }
  }

  async getUserByEmail(email: string): Promise<UserWithoutPassword | null> {
    this.validateEmail(email); // Input validation

    try {
      // Find user by email, exclude password field
      const user = await this.userModel.findOne(
        { email: email.trim().toLowerCase() },
        { password: 0, __v: 0 },
      )
        .lean()
        .exec();

      if (!user) {
        this.logger.debug(`User not found with email: ${email}`);
        return null;
      }

      return user as UserWithoutPassword;
    } catch (error: unknown) {
      const err = error as { message?: string };

      const errorMessage = err.message || (error instanceof Error ? error.message : String(error));
      const errorStack = error instanceof Error ? error.stack : '';

      this.logger.error(`Error fetching user by email: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException('Failed to retrieve user. Please try again later.');
    }
  }

  async generateAccessToken(payload: any): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET || 'secret',
    });
  }

  async generateRefreshToken(payload: any): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    });
  }
}
