import { z } from 'zod/mini';

export const uploadFileSchema = z.object({
  route: z.string().check(z.minLength(1)),
  files: z
    .array(
      z.object({
        name: z.string().check(z.minLength(1)),
        size: z.union([z.int().check(z.positive()), z.literal(0)]),
        type: z.string().check(z.minLength(1)),
      })
    )
    .check(z.minLength(1)),
  metadata: z.optional(z.unknown()),
});
export type UploadFileSchema = z.infer<typeof uploadFileSchema>;
