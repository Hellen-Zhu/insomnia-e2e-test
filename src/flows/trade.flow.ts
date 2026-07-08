import type { TradePortalPage } from '../pages/trade-portal/trade-portal.page';
import type { BlotterRow } from '../pages/trade-portal/blotter-view.component';
import type { NewTradePage } from '../pages/new-trade/new-trade.page';

export interface NewTradeRequest {
  counterparty: string;
  portfolio: string;
  /** 交易捕获文件路径（相对项目根） */
  tradeFile: string;
}

/**
 * 交易生命周期流程：跨 TradePortalPage / NewTradePage 的业务编排。
 * maker 和 checker 的 RoleSession 各持有一个实例，绑定各自的 context。
 * 搜索结果统一在 all trades 视图断言，若你们默认视图不同在此调整。
 */
export class TradeFlow {
  constructor(
    private readonly portal: TradePortalPage,
    private readonly newTrade: NewTradePage,
  ) {}

  /** maker：从 portal 发起新建 → 填表 → 传文件 → 保存并返回后端生成的 tradeId */
  async createTrade(request: NewTradeRequest): Promise<string> {
    await this.portal.startNewTrade();
    await this.newTrade.selectCounterparty(request.counterparty);
    await this.newTrade.selectPortfolio(request.portfolio);
    await this.newTrade.uploadTradeFile(request.tradeFile);
    return this.newTrade.saveAndGetTradeId();
  }

  /** 按 tradeId 搜索并返回首行，供断言状态列 */
  async findTradeRow(tradeId: string): Promise<BlotterRow> {
    await this.portal.filters.search(tradeId);
    return this.portal.allTradesBlotter.firstRow();
  }

  /** checker：搜索 → 行菜单 approve → 确认弹窗 */
  async approveTrade(tradeId: string): Promise<void> {
    await this.portal.filters.search(tradeId);
    await this.portal.allTradesBlotter.row(tradeId).performAction('approve');
    await this.portal.checkerActionDialog.confirm();
  }
}
