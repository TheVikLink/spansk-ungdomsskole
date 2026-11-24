import express from 'express';
import app from './server/vercel-app.js';

if (typeof express !== 'function' || typeof app !== 'function') throw new TypeError('Vercel Express entrypoint failed to load');

export default app;
