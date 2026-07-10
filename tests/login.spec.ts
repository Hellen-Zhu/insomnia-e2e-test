import { tradePortalTest as test } from '../src/fixtures/trade-portal.fixtures';
import { credentialsFor } from '../src/config/users';

/**
 * 登录 UI 本身的功能测试（打开→提交→逐项断言）。
 * 业务场景的登录前置请直接用 loginFlow.loginAs（UI 登录 + 等落地页就绪）。
 *
 * test.step 的标题沿用 Gherkin 措辞——它们会原样出现在 HTML 报告和 trace 里，
 * 业务方读报告时看到的仍是业务语言。
 */
test.describe('User Login', { tag: '@login' }, () => {
  test.beforeEach('I am on the login page', async ({ loginPage }) => {
    await loginPage.open();
  });

  test('Login successfully with a valid role', { tag: '@smoke' }, async ({ loginPage, tradePortalPage }) => {
    await test.step('When I login as "maker"', async () => {
      const { username, password } = credentialsFor('maker');
      await loginPage.login(username, password);
    });
    await test.step('Then the trade portal should be visible', async () => {
      await tradePortalPage.expectLanded();
    });
  });

  /* Scenario Outline 的原生等价物：数据表 + for 循环，每行生成一个独立测试。
   * 标题必须逐行可区分（这里带上 username），报告才不会读成同一描述重复 N 遍 */
  const invalidLogins = [
    {
      username: 'standard_user',
      password: 'wrong_password',
      error: 'Username and password do not match',
    },
    {
      username: 'locked_out_user',
      password: 'secret_sauce',
      error: 'Sorry, this user has been locked out.',
    },
    { username: '', password: 'secret_sauce', error: 'Username is required' },
  ];
  for (const { username, password, error } of invalidLogins) {
    test(`Login fails with invalid credentials (${username || 'empty username'})`, async ({
      loginPage,
    }) => {
      await test.step(`When I login with username "${username}" and password "${password}"`, async () => {
        await loginPage.login(username, password);
      });
      await test.step(`Then I should see the error message "${error}"`, async () => {
        await loginPage.expectError(error);
      });
    });
  }
});
