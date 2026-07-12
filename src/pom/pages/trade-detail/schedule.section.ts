import type { Locator } from '@playwright/test';
import { BaseComponent } from '../../components/base.component';
import { TextInput } from '../../components/form-field';

/** 行内可编辑字段：trade-detail-schedule-row-event-{index}-{field}-input */
export type ScheduleField = 'notional' | 'date';

/**
 * Schedule 区域（trade-detail-schedule-section）。
 * 元素清单只出现了 event-0 的两个输入框，但 testid 中的行号是序列，
 * 所以建模为 row(index)——一条声明覆盖任意行数，新增字段只需扩展
 * ScheduleField 联合类型。
 */
export class ScheduleSection extends BaseComponent {
  row(index: number): ScheduleRow {
    return new ScheduleRow(this.host, index);
  }
}

export class ScheduleRow {
  /* 依赖构造参数（index），须在构造器体内赋值（字段初始化器先于构造器体执行） */
  private readonly notional: TextInput;
  private readonly date: TextInput;

  constructor(section: Locator, index: number) {
    const input = (field: ScheduleField) =>
      new TextInput(section.getByTestId(`trade-detail-schedule-row-event-${index}-${field}-input`));
    this.notional = input('notional');
    this.date = input('date');
  }

  async setNotional(value: string): Promise<void> {
    await this.notional.fill(value);
  }

  async setDate(value: string): Promise<void> {
    await this.date.fill(value);
  }

  async expectNotional(value: string): Promise<void> {
    await this.notional.expectValue(value);
  }

  async expectDate(value: string): Promise<void> {
    await this.date.expectValue(value);
  }
}
