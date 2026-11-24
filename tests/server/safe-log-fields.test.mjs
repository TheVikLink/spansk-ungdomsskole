import test from 'node:test';
import assert from 'node:assert/strict';
import { safeRouteLabel } from '../../server/safe-log-fields.js';

test('safeRouteLabel logs Express route templates without path parameters or query data', () => {
  const request = {
    baseUrl: '/api',
    path: '/api/classes/student-secret-id/progress',
    originalUrl: '/api/classes/student-secret-id/progress?token=secret',
    route: { path: '/classes/:classId/progress' },
  };

  assert.equal(safeRouteLabel(request), '/api/classes/:classId/progress');
  assert.doesNotMatch(safeRouteLabel(request), /student-secret-id|secret/u);
});

test('safeRouteLabel uses a generic label when Express has no matched route', () => {
  assert.equal(safeRouteLabel({ path: '/api/private-value?token=secret' }), '[unmatched-route]');
});
