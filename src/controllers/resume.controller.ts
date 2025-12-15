import { Request, Response } from 'express';
import prisma from '../config/database';

export const getUserResumeSections = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const sections = await prisma.resumeSection.findMany({
      where: {
        resume: {
          userId: userId
        }
      },
      include: {
        resume: {
          select: {
            id: true,
            fileName: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: sections
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An error occurred'
    });
  }
};