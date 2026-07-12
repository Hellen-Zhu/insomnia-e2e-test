import { Given } from '../../fixtures/trade-portal.fixtures';

/**
 * 业务前置的登录步骤——注册在应用入口层，所有业务域的场景都可直接使用。
 * 每次真实走 UI 登录（应用暂不支持会话注入），流程末尾等落地页就绪。
 * 中途切换角色（maker→checker）时先清 cookie 再登录，避免旧会话干扰。
 * 登录 UI 本身的测试见 login.steps.ts 的细粒度步骤。
 */
Given('the {string} is logged in', async ({ context, loginFlow }, role: string) => {
  await context.clearCookies();
  await loginFlow.loginAs(role);
});
