import { createSchoolRuntime } from './runtime.js';
import { createSchoolHttpServer } from './http-server.js';

let runtime;
let server;
try {
  runtime = await createSchoolRuntime({ serveLocalStaticAssets: true });
  server = createSchoolHttpServer(runtime.app);
  server.listen(runtime.config.port, runtime.config.host, () => console.log(`Spansk school server listening on ${runtime.config.host}:${runtime.config.port}`));
} catch (error) {
  await runtime?.close();
  console.error(`School server did not start: ${error.message.replace(/https?:\/\/[^\s]+/gu, '[url]')}`);
  process.exitCode = 1;
}

async function stop() {
  if (server) await new Promise((resolve) => server.close(resolve));
  await runtime?.close();
}
process.once('SIGTERM', () => { void stop(); });
process.once('SIGINT', () => { void stop(); });
