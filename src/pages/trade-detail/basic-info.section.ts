import { BaseComponent } from '../../components/base.component';
import { TextInput } from '../../components/form-field';
import { Dropdown } from '../../components/dropdown';

/**
 * 基本信息卡片（trade-detail-basic-info-card）。
 * 三个表单控件均为"宿主 testid + 内部原生控件"结构，直接复用组件层。
 */
export class BasicInfoSection extends BaseComponent {
  private readonly dealDate = new TextInput(this.host.getByTestId('trade-detail-deal-date-input'));
  private readonly counterparty = new Dropdown(
    this.host.getByTestId('trade-detail-counterparty-combobox'),
  );
  private readonly portfolio = new Dropdown(
    this.host.getByTestId('trade-detail-portfolio-combobox'),
  );

  async setDealDate(date: string): Promise<void> {
    await this.dealDate.fill(date);
  }

  async selectCounterparty(name: string): Promise<void> {
    await this.counterparty.select(name);
  }

  async selectPortfolio(name: string): Promise<void> {
    await this.portfolio.select(name);
  }

  async expectDealDate(date: string): Promise<void> {
    await this.dealDate.expectValue(date);
  }

  async expectCounterparty(name: string): Promise<void> {
    await this.counterparty.expectSelected(name);
  }
}
