import { createServer } from 'node:http';

export function createSchoolHttpServer(requestListener) {
  const server = createServer({ maxHeaderSize: 16 * 1024 }, requestListener);
  server.headersTimeout = 10_000;
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 5_000;
  return server;
}
