import { Given } from '../fixtures/base.fixtures';

/**
 * 角色化登录前置——注册在基座实例上，任何领域的场景都可直接使用。
 * 走会话注入（不走 UI），登录 UI 本身的测试见 login.steps.ts。
 */
Given('I am logged in as {string}', async ({ loginAs }, role: string) => {
  await loginAs(role);
});
