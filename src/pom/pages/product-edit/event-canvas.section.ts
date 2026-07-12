import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from '../../components/base.component';

/**
 * 事件画布（event-canvas-drop-area）：从工具箱拖入事件节点，
 * 节点上可编辑/删除。三组 testid 全部按事件名参数化：
 *   工具箱项: event-toolbox-item-{Event}
 *   画布节点: event-canvas-node-{Event}-chip
 *   节点按钮: event-canvas-node-{Event}-edit-btn / -delete-btn
 * 事件名（StepOutFull / Cancellation / EarlyTermination...）随产品配置
 * 而变，故用 string 而非联合类型；常用事件名收敛到 test-data 维护。
 */
export class EventCanvasSection extends BaseComponent {
  /** 工具箱在画布外，从 page 级定位 */
  private toolboxItem(eventName: string): Locator {
    return this.host.page().getByTestId(`event-toolbox-item-${eventName}`);
  }

  node(eventName: string): CanvasNode {
    return new CanvasNode(this.host, eventName);
  }

  /** 从工具箱拖拽事件到画布，并确认节点出现 */
  async addEvent(eventName: string): Promise<void> {
    await this.toolboxItem(eventName).dragTo(this.host);
    await this.node(eventName).expectPresent();
  }
}

export class CanvasNode {
  /* 依赖构造参数（eventName），须在构造器体内赋值（字段初始化器先于构造器体执行） */
  private readonly chip: Locator;
  private readonly editBtn: Locator;
  private readonly deleteBtn: Locator;

  constructor(canvas: Locator, eventName: string) {
    this.chip = canvas.getByTestId(`event-canvas-node-${eventName}-chip`);
    this.editBtn = canvas.getByTestId(`event-canvas-node-${eventName}-edit-btn`);
    this.deleteBtn = canvas.getByTestId(`event-canvas-node-${eventName}-delete-btn`);
  }

  /** 打开该事件的 feature 编辑器 */
  async edit(): Promise<void> {
    await this.editBtn.click();
  }

  async remove(): Promise<void> {
    await this.deleteBtn.click();
    await this.expectAbsent();
  }

  async expectPresent(): Promise<void> {
    await expect(this.chip).toBeVisible();
  }

  async expectAbsent(): Promise<void> {
    await expect(this.chip).toBeHidden();
  }
}
