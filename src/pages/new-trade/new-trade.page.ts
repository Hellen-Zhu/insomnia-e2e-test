import { BasePage } from '../base.page';
import { BaseComponent } from '../../components/base.component';
import { Dropdown } from '../../components/dropdown';

export type StepInMode = 'full' | 'partial';

/**
 * Step-in 条件区（create-trade-stepin-container）：toggle 打开后才渲染。
 * full/partial 单选为参数化模式 create-trade-stepin-{mode}-radio。
 * 仅本页面使用，不提升到 components/。
 */
class StepInSection extends BaseComponent {
  private readonly oldCounterparty = new Dropdown(
    this.host.getByTestId('create-trade-old-counterparty-combobox'),
  );

  /* testid 在单选项宿主上，用 click 而非 check（check 要求原生 input） */
  async choose(mode: StepInMode, oldCounterpartyName: string): Promise<void> {
    await this.host.getByTestId(`create-trade-stepin-${mode}-radio`).click();
    await this.oldCounterparty.select(oldCounterpartyName);
  }
}

/**
 * New Trade 页面（create-trade-*）。
 * 从 TradePortalPage.startNewTrade() 进入；跳转编排归 flow 层。
 *
 * 注意 trade-file-upload 没有 create-trade 前缀——又一处命名不一致，
 * 建议随 blotter 那批一起反馈给前端。
 */
export class NewTradePage extends BasePage {
  readonly path = '/new-trade'; // 按真实路由调整

  private readonly fileUpload = this.page.getByTestId('trade-file-upload');
  private readonly counterparty = new Dropdown(
    this.page.getByTestId('create-trade-counterparty-combobox'),
  );
  private readonly portfolio = new Dropdown(
    this.page.getByTestId('create-trade-portfolio-combobox'),
  );

  private readonly stepInToggle = this.page.getByTestId('create-trade-stepin-toggle');
  private readonly stepIn = new StepInSection(
    this.page.getByTestId('create-trade-stepin-container'),
  );

  private btn(name: string) {
    return this.page.getByTestId(`create-trade-${name}-btn`);
  }

  /** 若 testid 打在包装元素而非 <input type=file> 上，改为 .locator('input[type=file]') */
  async uploadTradeFile(filePath: string): Promise<void> {
    await this.fileUpload.setInputFiles(filePath);
  }

  async selectCounterparty(name: string): Promise<void> {
    await this.counterparty.select(name);
  }

  async selectPortfolio(name: string): Promise<void> {
    await this.portfolio.select(name);
  }

  /** 原子动作：打开 step-in → 等区域渲染 → 选模式和原对手方 */
  async enableStepIn(mode: StepInMode, oldCounterpartyName: string): Promise<void> {
    await this.stepInToggle.click();
    await this.stepIn.expectVisible();
    await this.stepIn.choose(mode, oldCounterpartyName);
  }

  async save(): Promise<void> {
    await this.btn('save').click();
  }

  async skipRiskCheck(): Promise<void> {
    await this.btn('skip-risk').click();
  }
}
