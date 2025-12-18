
import 'express';

export declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      name: string | null;
      email: string;
      userType?: 'USER' | 'ADMIN';
      role?: {
        id: number;
        name?: string;
      };
    }

    interface Request {
      user: UserPayload;
    }
  }
}
