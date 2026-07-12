import { Pool } from 'pg';
import { env } from '../config/env';

/**
 * PostgreSQL access for E2E verification.
 *
 * Positioning: the mirror channel of api/ — the API layer WRITES preconditions,
 * the db layer READS persisted state to verify it. E2E tests never mutate the
 * database directly (seeding through SQL would bypass the business logic the
 * tests exist to exercise), so connect with a READ-ONLY database user.
 *
 * Persistence may lag the UI/API response (async pipelines) — assert with
 * `expect.poll` in steps rather than a single read:
 *
 *   await expect.poll(() => tradeDb.tradeStatus(tradeId)).toBe('NEW');
 */
export function createDbPool(): Pool {
  if (!env.databaseUrl) {
    throw new Error(
      `DATABASE_URL is not set (current env: ${env.name}, check env/.env.${env.name}) — ` +
        'database verification steps need it; scenarios without db assertions are unaffected.',
    );
  }
  /* Connection budget: steps inside a scenario run sequentially and a worker
   * runs one scenario at a time, so ONE connection per worker suffices (max: 1).
   * The pool is worker-scoped and lazy — only workers that actually execute a
   * db-asserting scenario open it — so the global ceiling is:
   *   connections <= workers that hit the db  (CI: workers=2 → at most 2)
   * idle connections are released between scenarios; if the target db is
   * heavily shared, put PgBouncer in front rather than raising max here. */
  return new Pool({
    connectionString: env.databaseUrl,
    max: 1,
    idleTimeoutMillis: 10_000,
  });
}
