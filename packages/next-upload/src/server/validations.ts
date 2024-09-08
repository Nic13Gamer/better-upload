import { z } from 'zod';

export const uploadFileSchema = z.object({
  route: z.string().min(1),
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        size: z.number().int().positive(),
        type: z.string().min(1),
      })
    )
    .min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type uploadFileSchema = z.infer<typeof uploadFileSchema>;
