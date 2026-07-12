import { tradePortalTest as test } from '../../fixtures/trade-portal.fixtures';

/**
 * Seed spec for AI agents (planner/generator setup_page): brings up a real
 * logged-in session landed on the trade portal, with the full fixture tree
 * (pages, flows, API clients) available.
 *
 * Runs only in the `seed` project (agent-only); npm scripts pin
 * --project=chromium so seeds never run in normal or CI suites.
 */
test('seed: maker logged in on the trade portal', async ({ loginFlow }) => {
  await loginFlow.loginAs('maker');
});
