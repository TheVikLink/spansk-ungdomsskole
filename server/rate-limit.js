const rateLimitMessage = Object.freeze({ error: 'For mange forsøk. Vent litt og prøv igjen.' });

export function createRateLimit({ windowMs = 60_000, limit = 30, scope = 'route', maxBuckets = 5_000, now = Date.now } = {}) {
  if (!Number.isSafeInteger(windowMs) || windowMs < 1 || !Number.isSafeInteger(limit) || limit < 1
      || !['ip', 'route'].includes(scope) || !Number.isSafeInteger(maxBuckets) || maxBuckets < 1 || typeof now !== 'function') {
    throw new TypeError('Invalid rate-limit configuration');
  }
  const requests = new Map();
  return (req, res, next) => {
    const current = now();
    const route = typeof req.route?.path === 'string' ? `${req.baseUrl || ''}${req.route.path}` : req.path;
    const key = scope === 'ip' ? String(req.ip || 'unknown') : `${req.ip || 'unknown'}:${req.method || 'GET'}:${route || '/'}`;
    let bucket = requests.get(key);
    if (!bucket || bucket.reset <= current) {
      if (!bucket && requests.size >= maxBuckets) {
        for (const [entry, value] of requests) if (value.reset <= current) requests.delete(entry);
        if (requests.size >= maxBuckets) return res.status(429).json(rateLimitMessage);
      }
      bucket = { count: 0, reset: current + windowMs };
      requests.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > limit) return res.status(429).json(rateLimitMessage);
    return next();
  };
}
