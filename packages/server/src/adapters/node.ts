import { handleRequest } from '@/router';
import type { Router } from '@/types';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Works with Express and Fastify.
 */
export function toNodeHandler(router: Router) {
  return async (req: any, res: any) => {
    try {
      const nodeReq: IncomingMessage = req.raw ?? req;
      const nodeRes: ServerResponse = res.raw ?? res;

      const url = new URL(nodeReq.url!, `http://${nodeReq.headers.host}`);

      const headers = new Headers();
      Object.entries(nodeReq.headers).forEach(([key, value]) => {
        if (value)
          headers.append(key, Array.isArray(value) ? value.join(',') : value);
      });

      let body: string | undefined;
      if (!req.raw) {
        if (nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD') {
          body = await new Promise<string>((resolve, reject) => {
            let data = '';
            nodeReq.on('data', (chunk) => (data += chunk));
            nodeReq.on('end', () => resolve(data));
            nodeReq.on('error', reject);
          });
        }
      } else {
        body =
          nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD'
            ? JSON.stringify(req.body)
            : undefined;
      }

      const request = new Request(url.toString(), {
        method: nodeReq.method,
        headers,
        body,
      });

      const response = await handleRequest(request, router);

      nodeRes.statusCode = response.status;
      response.headers.forEach((v, k) => nodeRes.setHeader(k, v));

      if (!req.raw) {
        nodeRes.end(response.body ? await response.text() : undefined);
      } else {
        res.send(response.body ? await response.text() : undefined);
      }
    } catch (error) {
      const nodeRes: ServerResponse = res.raw ?? res;
      nodeRes.statusCode = 500;
      nodeRes.setHeader('content-type', 'text/plain');
      if (!req.raw) {
        nodeRes.end('Internal Server Error');
      } else {
        res.send('Internal Server Error');
      }
    }
  };
}
