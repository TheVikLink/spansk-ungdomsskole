export function safeRouteLabel(request) {
  const routePath = typeof request?.route?.path === 'string' ? request.route.path : null;
  if (!routePath) return '[unmatched-route]';
  const basePath = typeof request.baseUrl === 'string' ? request.baseUrl : '';
  return `${basePath}${routePath}`;
}
