import type { ExecRoute, Metadata, Route } from '../types/internal';

export function route<M extends Metadata = {}>(route: Route<M>): ExecRoute {
  return () => route;
}
