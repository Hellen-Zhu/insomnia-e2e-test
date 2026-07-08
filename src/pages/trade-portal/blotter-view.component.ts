import { expect, type Page } from '@playwright/test';
import { BaseComponent } from '../../components/base.component';

/**
 * Blotter 视图组件：live / pendingApproval / all / forwardTrades / americanOptions
 * 五个视图是同一 widget 的实例，testid 模式为
 *   宿主: blotter-view-{viewId}
 *   工具按钮: blotter-view-{viewId}-{action}-btn
 * 因此声明一次、按 viewId 实例化五次——不为每个视图重复登记 9 个元素。
 */
const BLOTTER_CONFIG = {
  live: { table: 'blotter-table-live-trades', row: 'live-trades-row' },
  pendingApproval: { table: 'blotter-table-pending-approval', row: 'pending-approval-row' },
  all: { table: 'blotter-table-all-trades', row: 'all-trades-row' },
  forwardTrades: { table: 'blotter-table-forward-trades', row: 'forward-trades-row' },
  // americanOptions 的行 testid 未在元素清单中出现，接入时按实际确认
  americanOptions: { table: 'blotter-table-american-options', row: 'american-options-row' },
} as const;

export type BlotterViewId = keyof typeof BLOTTER_CONFIG;

/** swap 方向按视图不同可用项不同（如 live 有 down-left），联合类型覆盖全部 */
export type SwapDirection = 'left' | 'right' | 'up' | 'down' | 'down-left';

/** 行操作菜单项：trade-row-action-{action} */
export type TradeRowAction =
  | 'view-details'
  | 'approve'
  | 'reject'
  | 'allocation'
  | 'novationremaining'
  | 'novationoutgoing'
  | 'partialnovationremaining'
  | 'partialnovationoutgoing'
  | 'portfolioreassignment'
  | 'earlytermination'
  | 'partialtermination'
  | 'stepoutfull'
  | 'stepoutpartial'
  | 'cancellation';

export class BlotterView extends BaseComponent {
  private readonly cfg: (typeof BLOTTER_CONFIG)[BlotterViewId];

  constructor(
    page: Page,
    private readonly viewId: BlotterViewId,
  ) {
    super(page.getByTestId(`blotter-view-${viewId}`));
    this.cfg = BLOTTER_CONFIG[viewId];
  }

  /** 工具栏按钮统一走命名模式，新增按钮零登记成本 */
  private toolbarBtn(action: string) {
    return this.host.getByTestId(`blotter-view-${this.viewId}-${action}-btn`);
  }

  async swap(direction: SwapDirection): Promise<void> {
    await this.toolbarBtn(`swap-${direction}`).click();
  }

  async openBulkActions(): Promise<void> {
    await this.toolbarBtn('bulk-action').click();
  }

  async exportData(): Promise<void> {
    await this.toolbarBtn('export').click();
  }

  async maximize(): Promise<void> {
    await this.toolbarBtn('maximize').click();
  }

  async closeView(): Promise<void> {
    await this.toolbarBtn('close').click();
  }

  rows() {
    return this.host.getByTestId(this.cfg.row);
  }

  /** 按行内文本（如 trade ref）定位一行，覆盖任意行数 */
  row(text: string): BlotterRow {
    return new BlotterRow(this.rows().filter({ hasText: text }));
  }

  firstRow(): BlotterRow {
    return new BlotterRow(this.rows().first());
  }

  async expectRowCount(count: number): Promise<void> {
    await expect(this.rows()).toHaveCount(count);
  }

  async expectEmpty(): Promise<void> {
    await expect(this.host.getByTestId('blotter-table-empty-state')).toBeVisible();
  }
}

export class BlotterRow extends BaseComponent {
  /**
   * 断言行内包含全部给定文本（tradeId、状态等）。
   * 行内单元格没有列级 testid，暂用整行文本包含断言；
   * 若前端补了 cell 级 testid，改为按列精确断言。
   */
  async expectContains(...texts: string[]): Promise<void> {
    for (const text of texts) {
      await expect(this.host).toContainText(text);
    }
  }

  async openActionsMenu(): Promise<void> {
    await this.host.getByTestId('transaction-row-actions-btn').click();
  }

  /** 打开行菜单并执行动作；菜单浮层挂在 body 下，故从 page 级定位 */
  async performAction(action: TradeRowAction): Promise<void> {
    await this.openActionsMenu();
    await this.host.page().getByTestId(`trade-row-action-${action}`).click();
  }
}
