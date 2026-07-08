import { BasePage } from '../base.page';
import { TopNavSection } from './top-nav.section';
import { BottomNavSection } from './bottom-nav.section';
import { TransactionFilterSection } from './transaction-filter.section';
import { BlotterView } from './blotter-view.component';
import { CheckerActionDialog } from './checker-action.dialog';

/**
 * Trade Portal 页面（真实项目参考实现）。
 *
 * 91+ 条元素清单收敛为：2 个共享 Section + 1 个筛选 Section
 * + 1 个 BlotterView 组件（5 实例）+ 3 个页面级元素。
 * 页面对象自身只做组合，不直接持有区域内部的定位器。
 *
 * 注意：本页使用 getByTestId，接入时确认 playwright.config.ts 的
 * testIdAttribute 与你们前端一致（data-testid / data-test）。
 */
export class TradePortalPage extends BasePage {
  readonly path = '/trade-portal'; // 按真实路由调整

  readonly topNav = new TopNavSection(this.page.getByTestId('layout-topnav-container'));
  readonly bottomNav = new BottomNavSection(this.page.getByTestId('bottomnav-container'));
  readonly filters = new TransactionFilterSection(
    this.page.getByTestId('transaction-list-container'),
  );

  readonly liveBlotter = new BlotterView(this.page, 'live');
  readonly pendingApprovalBlotter = new BlotterView(this.page, 'pendingApproval');
  readonly allTradesBlotter = new BlotterView(this.page, 'all');
  readonly forwardTradesBlotter = new BlotterView(this.page, 'forwardTrades');
  readonly americanOptionsBlotter = new BlotterView(this.page, 'americanOptions');

  /** blotter 行 approve/reject 触发的确认弹窗（页面级浮层） */
  readonly checkerActionDialog = new CheckerActionDialog(
    this.page.getByTestId('checker-action-dialog'),
  );

  private readonly refreshBtn = this.page.getByTestId('trades-refresh-btn');
  private readonly newTradeBtn = this.page.getByTestId('trades-new-trade-btn');
  private readonly bulkActionConfirmBtn = this.page.getByTestId('bulk-action-dialog-confirm-btn');

  async refresh(): Promise<void> {
    await this.refreshBtn.click();
  }

  async startNewTrade(): Promise<void> {
    await this.newTradeBtn.click();
  }

  async confirmBulkAction(): Promise<void> {
    await this.bulkActionConfirmBtn.click();
  }
}
