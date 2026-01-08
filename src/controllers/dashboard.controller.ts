import { Request, Response } from 'express';
import prisma from '../config/database';
import { activityService } from '../services/activity.service';

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
      fileName: version.fileName,
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

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
 
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
   
    // Check if resume exists and belongs to user
    const resume = await prisma.resumeVersions.findUnique({
      where: { id },
      include: {
        resume: true
      }
    });
 
    if (!resume) {
      return res.status(404).json({ status: 'error', message: 'Resume not found' });
    }
 
    if (resume.resume.userId !== userId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }
 
    // Delete resume (cascades to versions)
    await prisma.resumeVersions.delete({
      where: { id }
    });
    console.log("resume deleted", resume);
    // Log activity (skip generic middleware log to avoid duplicates)
    res.locals.skipActivityLog = true;
    await activityService.logActivity(
      userId,
      'DELETE_RESUME',
      `Deleted resume: ${resume.fileName}`,
      { resumeId: id, fileName: resume.fileName }
    );
 
    return res.json({
      status: 'success',
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete resume';
    res.status(500).json({ status: 'error', message });
  }
};

export const renameResume = async (req: Request, res: Response) => {
  try {
    const { resumeId, fileName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!resumeId) {
      return res.status(400).json({ status: 'error', message: 'Resume ID is required' });
    }

    if (!fileName || fileName.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'File name is required' });
    }

    // Check if resume exists and belongs to user
    const resume = await prisma.resumeVersions.findUnique({
      where: { id: resumeId },
      include: {
        resume: true
      }
    });

    if (!resume) {
      return res.status(404).json({ status: 'error', message: 'Resume not found' });
    }

    if (resume.resume.userId !== userId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    // Ensure fileName ends with .pdf extension
    const newFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const oldFileName = resume.fileName;

    // Update the fileName
    const updatedResume = await prisma.resumeVersions.update({
      where: { id: resumeId },
      data: { fileName: newFileName }
    });

    // Log activity (skip generic middleware log to avoid duplicates)
    res.locals.skipActivityLog = true;
    await activityService.logActivity(
      userId,
      'RENAME_RESUME',
      `Renamed resume from "${oldFileName}" to "${newFileName}"`,
      { resumeId, oldFileName, newFileName }
    );

    return res.json({
      status: 'success',
      message: 'Resume renamed successfully',
      data: {
        id: updatedResume.id,
        fileName: updatedResume.fileName
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to rename resume';
    res.status(500).json({ status: 'error', message });
  }
};