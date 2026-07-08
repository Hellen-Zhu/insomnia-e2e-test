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
  constructor(
    private readonly section: Locator,
    private readonly index: number,
  ) {}

  private input(field: ScheduleField): TextInput {
    return new TextInput(
      this.section.getByTestId(`trade-detail-schedule-row-event-${this.index}-${field}-input`),
    );
  }

  async setNotional(value: string): Promise<void> {
    await this.input('notional').fill(value);
  }

  async setDate(value: string): Promise<void> {
    await this.input('date').fill(value);
  }

  async expectNotional(value: string): Promise<void> {
    await this.input('notional').expectValue(value);
  }

  async expectDate(value: string): Promise<void> {
    await this.input('date').expectValue(value);
  }
}
