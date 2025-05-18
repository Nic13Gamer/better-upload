import type { StandardSchemaV1 } from '@/server/types/standard-schema';

export async function standardValidate<T extends StandardSchemaV1>(
  schema: T,
  input: unknown
): Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<T>>> {
  let result = schema['~standard'].validate(input);
  if (result instanceof Promise) result = await result;

  return result;
}
