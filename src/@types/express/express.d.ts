
import 'express';

export declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      name: string| null;
      email: string;
    }

    interface Request {
      user: UserPayload;
    }
  }
}
