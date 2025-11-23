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
import { RegisterUserDTO } from 'src/auth/dto/register-user.dto';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private validateEmail(email: string): void {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required and cannot be empty.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new BadRequestException('The email format is invalid.');
    }
  }

  async createUser(registerUserDTO: RegisterUserDTO): Promise<UserWithoutPassword> {
    // Input validation
    this.validateEmail(registerUserDTO.email);

    if (!registerUserDTO.name || !registerUserDTO.name.trim()) {
      throw new BadRequestException('Name is required and cannot be empty.');
    }

    if (!registerUserDTO.password || registerUserDTO.password.length < 6) {
      throw new BadRequestException('Password is required and must be at least 6 characters long.');
    }

    try {
      // Generate username from email
      const username = registerUserDTO.email.split('@')[0].trim();

      if (!username) {
        throw new BadRequestException('Invalid email format: cannot extract username.');
      }

      // Create user
      const user = await this.userModel.create({
        username,
        name: registerUserDTO.name.trim(),
        email: registerUserDTO.email.trim().toLowerCase(),
        password: registerUserDTO.password,
      });

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userObject } = user.toObject();

      this.logger.log(`User created successfully: ${user.email}`);
      return userObject as UserWithoutPassword;
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };

      // Handle duplicate key error (MongoDB unique constraint)
      if (err.code === 11000) {
        this.logger.warn(`Attempted to create user with duplicate email: ${registerUserDTO.email}`);
        throw new ConflictException('Email is already taken.');
      }

      // Handle validation errors
      if (err.message?.includes('validation failed')) {
        this.logger.error(`Validation error: ${err.message}`);
        throw new BadRequestException('Invalid user data provided.');
      }

      // Handle other errors
      const errorMessage = err.message || (error instanceof Error ? error.message : String(error));
      const errorStack = error instanceof Error ? error.stack : '';
      
      this.logger.error(`Error creating user: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException('Failed to create user. Please try again later.');
    }
  }

  async getUserByEmail(email: string): Promise<UserWithoutPassword | null> {
    this.validateEmail(email); // Input validation

    try {
      // Find user by email, exclude password field
      const user = await this.userModel.findOne(
          { email: email.trim().toLowerCase() },
          { name: 1, username: 1, email: 1, role: 1, _id: 1 },
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
}
