import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from '../../components/base.component';
import { TextArea } from '../../components/form-field';

export type NovationPnlKind = 'original' | 'combined' | 'delta';
export type NovationSide = 'original' | 'new';

export interface TradeChangeDetails {
  reason: string;
  comments?: string;
}

/**
 * 交易变更确认弹窗（trade-change-confirmation-dialog）：
 * 动态操作提交后展示变更 diff，填 reason/comments 后最终确认。
 * novation 类操作额外渲染双栏对比区（原交易 / 新交易）与 PnL 汇总，
 * 其 testid 缺 trade-change 前缀（novation-*），建议反馈前端。
 */
export class TradeChangeConfirmationDialog extends BaseComponent {
  /* reason 按原生 <select> 处理；若为自定义组件改用 components/Combobox */
  private readonly reasonSelect = this.host.getByTestId('trade-change-reason-select');
  private readonly comments = new TextArea(
    this.host.getByTestId('trade-change-comments-textarea'),
  );
  private readonly diffList = this.host.getByTestId('trade-change-diff-list');

  /** 通用 diff 行：trade-change-diff-item-{index} */
  diffItem(index: number): Locator {
    return this.host.getByTestId(`trade-change-diff-item-${index}`);
  }

  async expectDiffContains(index: number, text: string): Promise<void> {
    await expect(this.diffItem(index)).toContainText(text);
  }

  /** 填 reason/comments 并最终确认；弹窗关闭断言兼作提交完成的同步点 */
  async confirmWith(details: TradeChangeDetails): Promise<void> {
    await this.expectVisible();
    await expect(this.diffList).toBeVisible();
    await this.reasonSelect.selectOption(details.reason);
    if (details.comments) {
      await this.comments.fill(details.comments);
    }
    await this.host.getByTestId('trade-change-confirm-btn').click();
    await this.expectHidden();
  }

  async dismiss(): Promise<void> {
    await this.host.getByTestId('trade-change-cancel-btn').click();
    await this.expectHidden();
  }

  /* ---------- novation 专属对比区 ---------- */

  async expectNovationSplitLayout(): Promise<void> {
    await expect(this.host.getByTestId('novation-split-layout')).toBeVisible();
  }

  /** PnL 汇总：novation-{original|combined|delta}-pnl */
  async expectNovationPnl(kind: NovationPnlKind, value: string): Promise<void> {
    await expect(this.host.getByTestId(`novation-${kind}-pnl`)).toContainText(value);
  }

  /** 双栏 diff 行：novation-{original|new}-trade-diff-item-{index} */
  novationDiffItem(side: NovationSide, index: number): Locator {
    return this.host.getByTestId(`novation-${side}-trade-diff-item-${index}`);
  }

  async expectNovationDiffContains(
    side: NovationSide,
    index: number,
    text: string,
  ): Promise<void> {
    await expect(this.novationDiffItem(side, index)).toContainText(text);
  }
}
