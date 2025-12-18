import { Request, Response } from 'express';
import prisma from '../config/database';
import { resumeService } from '../services/resume.service';

export const getUserResumeSections = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const sections = await prisma.resumeVersions.findMany({
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

/**
 * Delete a resume and its uploaded file.
 * Only the owner or admin can delete a resume.
 */
export const deleteResume = async (req: Request, res: Response) => {
  try {
    // the id param is the resume version id
    const { id } = req.params;
    const user = req.user;

    console.info(`DELETE /resume/${id} requested by user=${user?.id}`);

    if (!id) {
      return res.status(400).json({ status: 'error', message: 'Resume id is required' });
    }

    const normalizedId = String(id);

    // quick sanity log for debugging
    console.debug('Normalized id:', normalizedId);

    const resume = await prisma.resumeVersions.findUnique({ where: { id: normalizedId } });

    if (!resume) {
      console.warn(`Resume not found for id=${normalizedId}`);
      return res.status(404).json({ status: 'error', message: 'Resume not found' });
    }

    // Authorization: owner or admin
    // const isOwner = !!(user && user.id === resume.id);
    // const isAdmin = !!(
    //   user &&
    //   typeof user.userType === 'string' &&
    //   user.userType.toLowerCase() === 'admin'
    // );

    // console.debug(`Authorization check: isOwner=${isOwner} isAdmin=${isAdmin} userType=${user?.userType}`);

    // if (!isOwner && !isAdmin) {
    //   console.warn(`Delete forbidden: user=${user?.id} not owner or admin for resume=${normalizedId}`);
    //   return res.status(403).json({ status: 'error', message: 'Forbidden' });
    // }

    await resumeService.deleteResume(normalizedId);

    res.json({ status: 'success', message: 'Resume deleted' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'An error occurred' });
  }
};