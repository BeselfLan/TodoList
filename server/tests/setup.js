// Runs once per test file, before any test module is imported.

// app.js reads JWT_SECRET at import time and exits if it is missing. Setting a
// throwaway value here also means tests never depend on the real secret in
// server/.env, and never accidentally mint tokens that work in production.
process.env.JWT_SECRET = 'test-secret-not-used-anywhere-real';
process.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id';

// Hard stop: dotenv loads server/.env at import, so a misconfigured machine
// could otherwise point a test run at a real database. These tests mock the
// database module and never connect, but this guard costs nothing and catches
// the day someone writes a test that does connect.
const url = process.env.DATABASE_URL || '';
if (url && !/localhost|127\.0\.0\.1|_test/.test(url)) {
    throw new Error(`Refusing to run tests against non-test database: ${url}`);
}
