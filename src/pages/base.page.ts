import { expect, type Page } from '@playwright/test';

/**
 * 所有页面对象的基类。
 *
 * 刻意保持精简：只承载"页面"这一概念共有的能力（路径、打开、就位断言）。
 * 通用操作请优先使用 Playwright 原生 API，不要把工具方法堆进基类。
 */
export abstract class BasePage {
  /** 页面相对路径，与 playwright.config.ts 中的 baseURL 拼接 */
  abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  /** 直接导航到本页面 */
  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** 断言当前已处于本页面（URL 匹配） */
  async expectOpened(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(this.path)}$`));
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
