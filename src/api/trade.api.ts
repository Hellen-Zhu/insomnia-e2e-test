import * as fs from 'node:fs';
import { expect } from '@playwright/test';
import { ApiClient } from './api-client';
import { datFileFor, type CreateTradeCase, type ProductType } from '../utils/trade-cases';

interface CreateTradeResponse {
  data: { trade: { id: string } };
}

/**
 * 交易造数客户端。
 *
 * POST /api/v1/trades/create（multipart）：
 *   - trade:   JSON 部分（basic.counterparty / basic.portfolio）
 *   - datfile: 按 productType 解析的 .dat 捕获文件
 *   - 身份经 X-User-Id 头传递（按请求设置，不同角色造数互不影响）
 * 响应中 tradeId 位于 data.trade.id。
 */
export class TradeApi extends ApiClient {
  async createTrade(
    productType: ProductType,
    tradeCase: CreateTradeCase,
    userId: string,
  ): Promise<string> {
    const url = '/api/v1/trades/create';
    const response = await this.api.post(url, {
      headers: { 'X-User-Id': userId },
      multipart: {
        trade: JSON.stringify({
          basic: {
            counterparty: tradeCase.counterparty,
            portfolio: tradeCase.portfolio,
          },
          /* stepIn 场景若走 API 造数，按真实契约在此扩展 payload */
        }),
        datfile: fs.createReadStream(datFileFor(productType)),
      },
    });
    expect(response, `POST ${url} → ${response.status()}`).toBeOK();
    const body = (await response.json()) as CreateTradeResponse;
    return body.data.trade.id;
  }
}
