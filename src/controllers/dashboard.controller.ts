import { Request, Response } from 'express';
import prisma from '../config/database';

export const getUserResumes = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'UserId is required',
      });
    }

    // Find all resume versions belonging to the user
    const resumeVersions = await prisma.resumeVersions.findMany({
      where: {
        resume: {
          userId: userId,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (resumeVersions.length === 0) {
      return res.json({
        status: 'success',
        message: 'No resume versions found for this user',
        data: [],
      });
    }

    const resumeList = resumeVersions.map((version) => ({
      id: version.id,
      jobTitle: version.jobTitle,
      resumeurl: version.fileUrl,
      section: version.section,
      content: version.content,
      version: version.version,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
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