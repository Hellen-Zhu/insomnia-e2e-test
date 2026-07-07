# language: zh-CN
@checkout
功能: 购物结算
  作为一名已登录用户
  我希望能将商品加入购物车并完成结算
  以便购买所需商品

  背景:
    假如我已登录系统

  @smoke
  场景: 单件商品完整购买流程
    当我将商品 "Sauce Labs Backpack" 加入购物车
    那么购物车角标数量应为 1
    当我打开购物车
    那么购物车中应包含商品 "Sauce Labs Backpack"
    当我以收件人 "San" "Zhang"、邮编 "100000" 完成结算
    那么订单应提交成功

  场景: 多件商品加入购物车
    当我将商品 "Sauce Labs Backpack" 加入购物车
    并且我将商品 "Sauce Labs Bike Light" 加入购物车
    那么购物车角标数量应为 2
    当我打开购物车
    那么购物车中应有 2 件商品
