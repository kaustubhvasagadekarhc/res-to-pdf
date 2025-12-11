import { z } from "zod";

export const resumeUploadSchema = z.object({
  username: z.string().min(1),
});

export const resumeParseSchema = z.object({
  resumeUrl: z.string().url(),
  resumeId: z.string().optional(),
});
