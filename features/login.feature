# language: zh-CN
@login
功能: 用户登录
  作为一名用户
  我希望能够登录系统
  以便使用购物功能

  背景:
    假如我打开登录页

  @smoke
  场景: 使用有效凭证成功登录
    当我使用有效凭证登录
    那么我应该看到商品列表页

  场景大纲: 使用无效凭证登录失败
    当我使用用户名 "<用户名>" 和密码 "<密码>" 登录
    那么我应该看到错误提示 "<错误信息>"

    例子:
      | 用户名          | 密码           | 错误信息                                                    |
      | standard_user   | wrong_password | Username and password do not match                          |
      | locked_out_user | secret_sauce   | Sorry, this user has been locked out.                       |
      |                 | secret_sauce   | Username is required                                        |
