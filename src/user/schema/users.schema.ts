import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '../user.types';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  username: string;

  @Prop({ unique: true, required: true })
  email: number;

  @Prop({ required: true })
  password: string;

  @Prop({ default: Role.Student })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
