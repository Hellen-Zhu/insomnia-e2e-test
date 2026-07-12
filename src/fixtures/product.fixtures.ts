import { createBdd } from 'playwright-bdd';
import { tradePortalTest } from './trade-portal.fixtures';
import { ProductEditPage } from '../pages/product-edit/product-edit.page';
import { ProductComposerPage } from '../pages/product-composer/product-composer.page';

/**
 * 产品域 fixtures：编排页（产品列表 + 审计日志）与编辑页
 * （画布/feature 编辑器/schema 上传经页面对象访问）。
 * 从应用入口层 extend，产品场景同样可用登录/落地步骤。
 */
type ProductFixtures = {
  productComposerPage: ProductComposerPage;
  productEditPage: ProductEditPage;
};

export const test = tradePortalTest.extend<ProductFixtures>({
  productComposerPage: async ({ page }, use) => use(new ProductComposerPage(page)),
  productEditPage: async ({ page }, use) => use(new ProductEditPage(page)),
});

export const { Given, When, Then } = createBdd(test);
