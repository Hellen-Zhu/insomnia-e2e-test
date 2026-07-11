import type { TradePortalPage } from '../pages/trade-portal/trade-portal.page';
import type { BlotterRow } from '../pages/trade-portal/blotter-view.component';
import type { NewTradePage } from '../pages/new-trade/new-trade.page';
import type { TradeDetailPage } from '../pages/trade-detail/trade-detail.page';
import { datFileFor, type CreateTradeCase, type ProductType } from '../../utils/trade-cases';

/**
 * 交易生命周期流程：跨 TradePortalPage / NewTradePage / TradeDetailPage 的业务编排。
 * maker/checker 重新登录切换身份后共用同一实例。
 * 搜索结果统一在 all trades 视图断言，若你们默认视图不同在此调整。
 */
export class TradeFlow {
  constructor(
    private readonly portal: TradePortalPage,
    private readonly newTrade: NewTradePage,
    private readonly tradeDetail: TradeDetailPage,
  ) {}

  /**
   * maker：从 portal 发起新建 → 选对手方/组合 →（可选 step-in）→
   * 按 productType 上传 .dat 捕获文件 → 保存并返回后端生成的 tradeId。
   * productType 由场景声明（固定枚举，绑定 .dat 路径）；
   * 可变参数来自 test-data/trades/create-trade-cases.yaml（按 caseId 取）。
   */
  async createTrade(productType: ProductType, tradeCase: CreateTradeCase): Promise<string> {
    await this.portal.startNewTrade();
    await this.newTrade.selectCounterparty(tradeCase.counterparty);
    await this.newTrade.selectPortfolio(tradeCase.portfolio);
    if (tradeCase.stepIn) {
      await this.newTrade.enableStepIn(tradeCase.stepIn.mode, tradeCase.stepIn.counterparty);
    }
    await this.newTrade.uploadTradeFile(datFileFor(productType));
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

  /** checker：搜索 → 行菜单 reject → 确认弹窗（与 approve 共用同一个确认弹窗） */
  async rejectTrade(tradeId: string): Promise<void> {
    await this.portal.filters.search(tradeId);
    await this.portal.allTradesBlotter.row(tradeId).performAction('reject');
    await this.portal.checkerActionDialog.confirm();
  }

  /**
   * checker：详情页入口的 approve——搜索 → 行菜单 view-details → 页内 approve →
   * 返回 portal。与 approveTrade 是同一业务动作的另一条 UI 布线（不同按钮、
   * 不同确认弹窗组件），出口统一回 portal，让入口无关的行断言步骤直接可用。
   * goBack 假定确认后仍停留在详情页——若真实应用确认后自动跳回列表，删掉即可。
   */
  async approveTradeFromDetails(tradeId: string): Promise<void> {
    await this.openTradeDetails(tradeId);
    await this.tradeDetail.approve();
    await this.tradeDetail.goBack();
  }

  /** checker：详情页入口的 reject（与 approveTradeFromDetails 同一进出路径） */
  async rejectTradeFromDetails(tradeId: string): Promise<void> {
    await this.openTradeDetails(tradeId);
    await this.tradeDetail.reject();
    await this.tradeDetail.goBack();
  }

  /** 搜索并经行菜单 view-details 打开详情页（就位断言以容器渲染为准） */
  private async openTradeDetails(tradeId: string): Promise<void> {
    await this.portal.filters.search(tradeId);
    await this.portal.allTradesBlotter.row(tradeId).performAction('view-details');
    await this.tradeDetail.expectOpened();
  }
}
