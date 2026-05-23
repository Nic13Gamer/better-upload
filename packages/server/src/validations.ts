import * as z from 'zod/mini';

export const clientRequestSchema = z.union([
  z.object({
    upload: z.object({
      route: z.string().check(z.minLength(1)),
      files: z
        .array(
          z.object({
            _id: z.int(),
            name: z.string().check(z.minLength(1)),
            size: z.union([z.literal(0), z.int().check(z.positive())]),
            type: z.string(),
          })
        )
        .check(z.minLength(1)),
      metadata: z.optional(z.unknown()),
    }),
  }),
]);
export type ClientRequestSchema = z.infer<typeof clientRequestSchema>;
