export async function withRetries<T>(
  fn: () => Promise<T> | T,
  {
    retry = 0,
    delay = 0,
    signal,
    abortHandler,
  }: {
    retry?: number;
    delay?: number;
    signal?: AbortSignal;
    abortHandler?: () => void;
  } = {}
): Promise<T> {
  const maxTries = retry + 1;

  for (let attempt = 0; attempt < maxTries; attempt++) {
    if (attempt > 0) {
      if (signal?.aborted) {
        abortHandler?.();
        throw new Error('Retries aborted.');
      }

      if (delay) {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            signal?.removeEventListener('abort', abort);
            resolve(void 0);
          }, delay);

          const abort = () => {
            clearTimeout(timeout);
            signal?.removeEventListener('abort', abort);
            resolve(void 0);
          };

          signal?.addEventListener('abort', abort);
        });

        if (signal?.aborted) {
          abortHandler?.();
          throw new Error('Retries aborted.');
        }
      }
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
