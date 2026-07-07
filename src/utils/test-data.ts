import shippingProfiles from '../../test-data/shipping-profiles.json';

export interface ShippingProfile {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/**
 * 按业务别名取测试数据。Gherkin 中只出现别名（如 "default"），
 * 真实值维护在 test-data/ 下，业务方评审场景时不被数据细节干扰。
 */
export function getShippingProfile(name: string): ShippingProfile {
  const profile = (shippingProfiles as Record<string, ShippingProfile>)[name];
  if (!profile) {
    throw new Error(
      `Unknown shipping profile "${name}". Available: ${Object.keys(shippingProfiles).join(', ')}`,
    );
  }
  return profile;
}
