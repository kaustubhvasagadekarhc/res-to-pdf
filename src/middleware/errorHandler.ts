import { Request, Response } from 'express';

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
 
) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};