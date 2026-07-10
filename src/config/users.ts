/**
 * 角色 → 登录凭证映射。场景里只出现角色名（loginAs('maker')），
 * 凭证细节收口在这里。
 *
 * saucedemo 是公开演示站点，凭证公开、可入库。真实项目中：
 *   - 密码不入库：值从 CI secrets 注入（process.env.MAKER_PASSWORD ?? ...）
 *   - 或者干脆不需要密码：loginAs 走登录 API 换 token，这里只留 username
 */
export type Role = 'maker' | 'checker';

export interface Credentials {
  username: string;
  password: string;
}

const users: Record<Role, Credentials> = {
  maker: { username: 'standard_user', password: 'secret_sauce' },
  checker: { username: 'standard_user', password: 'secret_sauce' },
};

/** 场景传入的角色名是自由文本，此处校验并给出可用角色列表 */
export function credentialsFor(role: string): Credentials {
  const user = users[role as Role];
  if (!user) {
    throw new Error(`Unknown role '${role}'. Available roles: ${Object.keys(users).join(', ')}`);
  }
  return user;
}
