import { Request, Response } from 'express';
import prisma from '../config/database';

export const getUserResumes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated',
      });
    }

    const resumeVersions = await prisma.resumeVersions.findMany({
      where: {
        resume: {
          userId: userId,
        },
      },
      include: {
        resume: {
          select: {
            id: true,
            fileName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const resumeList = resumeVersions.map((version) => ({
      id: version.resume.id,
      fileName: version.resume.fileName,
      createdAt: version.resume.createdAt,
      updatedAt: version.resume.updatedAt,
      version: version.version,
      // changeNote: version.changeNote
    }));

    res.json({
      status: 'success',
      data: resumeList,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};
