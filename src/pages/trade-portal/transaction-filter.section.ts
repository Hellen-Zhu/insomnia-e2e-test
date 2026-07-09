import { BaseComponent } from '../../components/base.component';

/** 快捷筛选 tab：transaction-filter-{name}-btn 模式 */
export type TransactionFilterTab = 'all' | 'live' | 'pending' | 'american-options' | 'forward-trades';

/** 交易列表筛选区（transaction-*）：搜索 + 快捷 tab + 三个维度下拉 */
export class TransactionFilterSection extends BaseComponent {
  private readonly searchInput = this.host.getByTestId('transaction-search-input');
  private readonly typeSelect = this.host.getByTestId('transaction-type-filter-select');
  private readonly statusSelect = this.host.getByTestId('transaction-status-filter-select');
  private readonly eventStatusSelect = this.host.getByTestId('transaction-event-status-filter-select');

  async search(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);
  }

  async selectTab(tab: TransactionFilterTab): Promise<void> {
    await this.host.getByTestId(`transaction-filter-${tab}-btn`).click();
  }

  /* 三个下拉按原生 <select> 实现；若实为自定义组件，改用 components/Combobox */
  async filterByType(value: string): Promise<void> {
    await this.typeSelect.selectOption(value);
  }

  async filterByStatus(value: string): Promise<void> {
    await this.statusSelect.selectOption(value);
  }

  async filterByEventStatus(value: string): Promise<void> {
    await this.eventStatusSelect.selectOption(value);
  }
}
