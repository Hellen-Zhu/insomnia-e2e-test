import { expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { TopNavSection } from './top-nav.section';
import { BottomNavSection } from './bottom-nav.section';
import { TransactionFilterSection } from './transaction-filter.section';
import { BlotterView } from './blotter-view.component';
import { CheckerActionDialog } from './checker-action.dialog';
import { DynamicActionModal } from '../components/dynamic-action-modal';
import { PartialNovationDialog } from './partial-novation.dialog';
import { TradeChangeConfirmationDialog } from './trade-change-confirmation.dialog';

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
  readonly path = '/trades';

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

  /** 行操作（终止/novation/调仓等）共用的动态表单弹窗（组件层通用骨架） */
  readonly dynamicActionDialog = new DynamicActionModal(
    this.page.getByTestId('dynamic-action-dialog'),
  );

  /** 同一弹窗的 partial novation 视角：多出名义金额区的断言 */
  readonly partialNovationDialog = new PartialNovationDialog(
    this.page.getByTestId('dynamic-action-dialog'),
  );

  /** 动态操作提交后的变更确认弹窗（diff + reason/comments） */
  readonly tradeChangeConfirmation = new TradeChangeConfirmationDialog(
    this.page.getByTestId('trade-change-confirmation-dialog'),
  );

  private readonly refreshBtn = this.page.getByTestId('trades-refresh-btn');
  private readonly newTradeBtn = this.page.getByTestId('trades-new-trade-btn');
  private readonly bulkActionConfirmBtn = this.page.getByTestId('bulk-action-dialog-confirm-btn');

  /**
   * 登录落地断言：URL 到达 /trades 且 blotter 渲染完成。
   * URL 就位不代表数据区就位（SPA 先路由后取数），两个断言缺一不可。
   * 默认视图若不是 all trades，改用对应的 blotter 实例。
   */
  async expectLanded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/trades/);
    await this.allTradesBlotter.expectVisible();
  }

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
