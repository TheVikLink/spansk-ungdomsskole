import express from 'express';
import { createSchoolRuntime } from './runtime.js';
import { startupFailureCode } from './startup-diagnostics.js';

export function createLazyFunctionApp(loadRuntime) {
  const app = express();
  let runtimePromise;

  app.get('/', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.redirect(302, '/index.html');
  });

  app.use((req, res, next) => {
    if (!runtimePromise) {
      runtimePromise = Promise.resolve().then(loadRuntime).then((runtime) => {
        if (!runtime?.app || typeof runtime.app !== 'function') throw new Error('Vercel runtime did not return an Express application');
        return runtime.app;
      }).catch((error) => {
        console.error(`School runtime initialization failed: ${startupFailureCode(error)}`);
        throw error;
      });
    }

    const currentInitialization = runtimePromise;
    currentInitialization.then(
      (runtimeApp) => runtimeApp(req, res, next),
      () => {
        if (runtimePromise === currentInitialization) runtimePromise = undefined;
        if (res.headersSent) return;
        res.setHeader('Cache-Control', 'no-store');
        return res.status(503).json({ error: 'Tjenesten er midlertidig utilgjengelig' });
      },
    );
  });

  return app;
}

export default createLazyFunctionApp(() => createSchoolRuntime());
