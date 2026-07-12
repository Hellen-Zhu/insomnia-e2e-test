import { expect, type Locator, type Page } from '@playwright/test';
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
  private readonly emptyState = this.host.getByTestId('blotter-table-empty-state');

  /* 依赖 viewId（本类构造参数）的定位器必须在构造器体内赋值：
   * target ES2022 下字段初始化器先于构造器体执行，此时 viewId 尚未就绪 */
  private readonly rowsLocator: Locator;
  private readonly bulkActionsBtn: Locator;
  private readonly exportBtn: Locator;
  private readonly maximizeBtn: Locator;
  private readonly closeBtn: Locator;

  constructor(
    page: Page,
    private readonly viewId: BlotterViewId,
  ) {
    super(page.getByTestId(`blotter-view-${viewId}`));
    this.rowsLocator = this.host.getByTestId(BLOTTER_CONFIG[viewId].row);
    this.bulkActionsBtn = this.toolbarBtn('bulk-action');
    this.exportBtn = this.toolbarBtn('export');
    this.maximizeBtn = this.toolbarBtn('maximize');
    this.closeBtn = this.toolbarBtn('close');
  }

  /** 工具栏按钮统一走命名模式；固定按钮已提升为字段，工厂只服务运行时参数（swap 方向） */
  private toolbarBtn(action: string) {
    return this.host.getByTestId(`blotter-view-${this.viewId}-${action}-btn`);
  }

  async swap(direction: SwapDirection): Promise<void> {
    await this.toolbarBtn(`swap-${direction}`).click();
  }

  async openBulkActions(): Promise<void> {
    await this.bulkActionsBtn.click();
  }

  async exportData(): Promise<void> {
    await this.exportBtn.click();
  }

  async maximize(): Promise<void> {
    await this.maximizeBtn.click();
  }

  async closeView(): Promise<void> {
    await this.closeBtn.click();
  }

  rows(): Locator {
    return this.rowsLocator;
  }

  /** 按行内文本（如 trade ref）定位一行，覆盖任意行数 */
  row(text: string): BlotterRow {
    return new BlotterRow(this.rowsLocator.filter({ hasText: text }));
  }

  firstRow(): BlotterRow {
    return new BlotterRow(this.rowsLocator.first());
  }

  async expectRowCount(count: number): Promise<void> {
    await expect(this.rowsLocator).toHaveCount(count);
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }
}

export class BlotterRow extends BaseComponent {
  private readonly actionsMenuBtn = this.host.getByTestId('transaction-row-actions-btn');

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
    await this.actionsMenuBtn.click();
  }

  /** 菜单项按动作参数化；菜单浮层挂在 body 下，故从 page 级定位 */
  private actionMenuItem(action: TradeRowAction) {
    return this.host.page().getByTestId(`trade-row-action-${action}`);
  }

  /** 打开行菜单并执行动作 */
  async performAction(action: TradeRowAction): Promise<void> {
    await this.openActionsMenu();
    await this.actionMenuItem(action).click();
  }
}
