import { type Pool } from 'pg';

/**
 * Trade verification queries (read-only).
 *
 * TEMPLATE — table and column names below are placeholders; align them with the
 * real schema before first use (same status as api/user.api.ts). Keep queries
 * scoped by tradeId: ids are unique per scenario, which is what makes parallel
 * workers safe against each other.
 */

/** Persisted trade record shape — adjust to the real schema. */
export interface TradeRecord {
  id: string;
  status: string;
  counterparty: string;
  portfolio: string;
  updated_at: Date;
}

export class TradeQueries {
  constructor(private readonly pool: Pool) {}

  async findTrade(tradeId: string): Promise<TradeRecord | undefined> {
    const { rows } = await this.pool.query<TradeRecord>(
      /* TEMPLATE: adjust table/columns to the real schema */
      'SELECT id, status, counterparty, portfolio, updated_at FROM trades WHERE id = $1',
      [tradeId],
    );
    return rows[0];
  }

  /** Poll target for status assertions: expect.poll(() => tradeDb.tradeStatus(id)) */
  async tradeStatus(tradeId: string): Promise<string | undefined> {
    return (await this.findTrade(tradeId))?.status;
  }
}
