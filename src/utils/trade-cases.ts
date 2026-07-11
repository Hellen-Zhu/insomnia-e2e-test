import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * trade 模块的数据类型与代码级映射。取数本身走 case-data.ts 的全局索引
 * （getCase / getPreset，通用入口），本文件只负责两件事：
 *   1. 数据形状的类型定义（供 fixture/步骤在泛型收口处使用）
 *   2. productType → .dat 捕获文件的代码级映射（固定枚举，不进 YAML）
 */

/**
 * 产品类型是固定枚举，与 .dat 捕获文件按路径约定一一绑定
 * （test-data/trades/dat/{productType}.dat）——它不是用例的可变参数，
 * 因此不进 YAML；场景在步骤中声明产品类型（业务可见）。
 */
export const PRODUCT_TYPES = ['FX_TRF', 'FX_CO', 'FX_FBS'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** 场景传入的产品类型是自由文本，此处校验并列出支持的类型 */
export function assertProductType(value: string): ProductType {
  if (!(PRODUCT_TYPES as readonly string[]).includes(value)) {
    throw new Error(`Unknown product type '${value}'. Supported: ${PRODUCT_TYPES.join(', ')}`);
  }
  return value as ProductType;
}

export interface StepInDetails {
  mode: 'full' | 'partial';
  /** step-in 对手方（映射 create-trade-old-counterparty-combobox） */
  counterparty: string;
}

/** 建仓用例/preset 的可变业务参数（固定的产品类型不在此列）。
 * 取数：getCase<CreateTradeCase>(caseId) 或 getPreset<CreateTradeCase>('trade_preset', 别名) */
export interface CreateTradeCase {
  counterparty: string;
  portfolio: string;
  /** 可选：step-in 建仓（先选 counterparty/portfolio，再开 step-in 选模式与对手方） */
  stepIn?: StepInDetails;
}

/** 取消动作的数据形状（与 CancelTradeDialog.cancelWith 的入参结构一致）。
 * 取数：getPreset<CancellationPreset>('cancel_preset', 别名) */
export interface CancellationPreset {
  effectiveDate: string;
  reason: string;
  comments?: string;
}

const DAT_DIR = path.resolve(__dirname, '../../test-data/trades/dat');

/** 按产品类型解析 .dat 捕获文件路径；文件缺失时立刻报错而非让上传静默失败 */
export function datFileFor(productType: ProductType): string {
  const file = path.join(DAT_DIR, `${productType}.dat`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing .dat capture file for product type '${productType}': ${file}`);
  }
  return file;
}
