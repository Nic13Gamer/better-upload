import type { ExecRoute, Metadata, Route } from '../types/internal';

export function route<M extends Metadata = {}, U extends boolean = false>(
  route: Route<M, U>
): ExecRoute {
  return () => route as any;
}
