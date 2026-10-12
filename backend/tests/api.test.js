import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { ticketScope } from '../src/routes/index.js';
import { tenant } from '../src/middleware/auth.js';
describe('ResolveDesk API boundary', () => {
  test('health endpoint is public', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
  });
  test('ticket routes require authentication', async () => {
    const r = await request(app).get('/api/tickets');
    expect(r.status).toBe(401);
  });
  test('authenticated ticket creation validates input before database access', async () => {
    const token = jwt.sign(
      { id: 'u', organizationId: 'org', role: 'Customer' },
      process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    );
    const r = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(400);
  });
  test('ticket scope limits customers to their own tenant records', () => {
    expect(
      ticketScope({ id: 'customer-a', role: 'Customer' }, 'organization-a'),
    ).toEqual({ organizationId: 'organization-a', customerId: 'customer-a' });
    expect(
      ticketScope({ id: 'agent-a', role: 'Agent' }, 'organization-a'),
    ).toEqual({ organizationId: 'organization-a' });
  });
  test('tenant middleware takes organization id from the verified user', () => {
    const req = {
      user: { organizationId: 'trusted-organization' },
      body: { organizationId: 'client-organization' },
    };
    tenant(req, {}, () => {});
    expect(req.organizationId).toBe('trusted-organization');
  });
});
