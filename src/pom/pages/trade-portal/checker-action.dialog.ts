import { BaseComponent } from '../../components/base.component';

/**
 * Checker 行操作确认弹窗（checker-action-dialog）。
 * 由 blotter 行菜单的 approve/reject 触发，浮层挂在 body 下，
 * 由 TradePortalPage 持有（页面级，不属于任何 BlotterView）。
 */
export class CheckerActionDialog extends BaseComponent {
  /** 确认并等弹窗关闭——关闭断言兼作提交完成的同步点 */
  async confirm(): Promise<void> {
    await this.expectVisible();
    await this.host.getByTestId('checker-action-dialog-confirm-btn').click();
    await this.expectHidden();
  }

  async dismiss(): Promise<void> {
    await this.host.getByTestId('checker-action-dialog-cancel-btn').click();
    await this.expectHidden();
  }
}
