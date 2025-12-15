import { Request, Response } from 'express';
import prisma from '../config/database';

export const getUserResumes = async (req: Request, res: Response) => {
  try {
    // Verify that user is authenticated via JWT token
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated',
      });
    }

    // Get userId from request body
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'userId is required in request body',
      });
    }

    // Ensure authenticated user can only access their own resumes
    if (req.user.id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Cannot access another user\'s resumes.',
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
