export async function withRetries<T>(
  fn: () => Promise<T> | T,
  {
    maxTries = 1,
    delay = 0,
  }: {
    maxTries?: number;
    delay?: number;
  } = {}
): Promise<T> {
  for (let attempt = 0; attempt < maxTries; attempt++) {
    if (attempt > 0 && delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const result = await fn();

      return result;
    } catch (e) {
      if (attempt === maxTries - 1) {
        throw e;
      }
    }
  }

  // This should never happen
  throw new Error('Unreachable Better Upload code.');
}
