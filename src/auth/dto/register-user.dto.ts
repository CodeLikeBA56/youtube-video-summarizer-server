import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export const loginUserSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const checkSessionSchema = z.object({
  accessToken: z.string().min(1, { message: 'Access Token is required' }),
});

export const refreshAccessTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh Token is required' }),
});

export type LoginUserDTO = z.infer<typeof loginUserSchema>;
export type RegisterUserDTO = z.infer<typeof registerUserSchema>;
export type CheckSessionDTO = z.infer<typeof checkSessionSchema>;
export type RefreshAccessTokenDTO = z.infer<typeof refreshAccessTokenSchema>;