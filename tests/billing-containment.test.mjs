import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const start = source.indexOf('  // Billing containment:');
const end = source.indexOf('  // Entitlement & License', start);
assert.ok(start >= 0 && end > start, 'Billing containment block must exist');
const handlers = new Map();
runInNewContext(source.slice(start, end).replace(/: Request|: Response/g, ''), {
  app: { post: (path, handler) => handlers.set(path, handler) },
  // Any accidental DB mutation or session issuance fails the test.
  db: new Proxy({}, { get() { throw new Error('Unexpected database access'); } }),
  createSession() { throw new Error('Unexpected session issuance'); },
});
for (const path of ['/api/stripe/create-checkout-session', '/api/stripe/confirm-payment', '/api/stripe/webhook']) {
  test(path + ' cannot grant access from untrusted input', async () => {
    assert.ok(handlers.has(path));
    for (const body of [{}, { email: 'existing@example.test', sessionId: 'cs_forged', planType: 'annual' },
      { id: 'evt_forged', type: 'checkout.session.completed', data: { object: { customer_email: 'existing@example.test' } } }]) {
      let status, payload;
      const response = {
        status(value) { status = value; return this; },
        json(value) { payload = value; return this; },
        cookie() { assert.fail('Must not create a session cookie'); },
      };
      await handlers.get(path)({ body, headers: {} }, response);
      assert.equal(status, 503);
      assert.equal(payload.success ?? payload.received, false);
      assert.equal(payload.token, undefined);
      assert.equal(payload.user, undefined);
    }
  });
}
test('checkout UI uses account-linked subscription entry and never collects cards or confirms payment', () => {
  const modal = readFileSync(new URL('../src/components/MifecoStripeModal.tsx', import.meta.url), 'utf8');
  assert.match(modal, /href="\/\?subscribe=1"/);
  assert.doesNotMatch(modal, /confirm-payment|test_pm_accelerator_business|<input|fetch\(/);
});

