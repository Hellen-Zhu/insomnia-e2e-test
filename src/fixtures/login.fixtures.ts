import { createBdd } from 'playwright-bdd';
import { baseTest } from './base.fixtures';
import { LoginPage } from '../pages/login.page';

/** 登录域 fixtures：登录页（登录 UI 本身的功能测试用） */
type LoginFixtures = {
  loginPage: LoginPage;
};

export const test = baseTest.extend<LoginFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
});

export const { Given, When, Then } = createBdd(test);
