import { createBdd } from 'playwright-bdd';
import { baseTest } from './base.fixtures';
import { ProductEditPage } from '../pages/product-edit/product-edit.page';

/** 产品域 fixtures：产品编辑页（画布/feature 编辑器/schema 上传经页面对象访问） */
type ProductFixtures = {
  productEditPage: ProductEditPage;
};

export const test = baseTest.extend<ProductFixtures>({
  productEditPage: async ({ page }, use) => use(new ProductEditPage(page)),
});

export const { Given, When, Then } = createBdd(test);
