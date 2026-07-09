import * as fs from 'node:fs';
import * as path from 'node:path';
import { assertCaseIdPattern, loadYaml, pickCase } from './case-data';

/**
 * 产品类型是固定枚举，与 .dat 捕获文件按路径约定一一绑定
 * （test-data/trades/dat/{productType}.dat）——它不是用例的可变参数，
 * 因此不进 YAML；场景在步骤中声明产品类型（业务可见）。
 */
export const PRODUCT_TYPES = ['FX_TRF', 'FX_CO', 'FX_FBS'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Gherkin 传入的产品类型是自由文本，此处校验并列出支持的类型 */
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

/** 用例的可变业务参数（固定的产品类型不在此列） */
export interface CreateTradeCase {
  counterparty: string;
  portfolio: string;
  /** 可选：step-in 建仓（先选 counterparty/portfolio，再开 step-in 选模式与对手方） */
  stepIn?: StepInDetails;
}

interface TradeCasesDoc {
  /** Scenario Outline 按 productType 驱动时，每类产品使用的默认 caseId */
  defaults: Record<ProductType, string>;
  cases: Record<string, CreateTradeCase>;
}

/** trade 模块的数据文件；其他模块各建自己的 <module>-cases.yaml 与访问函数 */
const TRADE_CASES_FILE = 'test-data/trades/create-trade-cases.yaml';
const DAT_DIR = path.resolve(__dirname, '../../test-data/trades/dat');

/** trade 模块的 caseId 模式：模块前缀即命名空间，跨模块结构上不可能撞号。
 * 将来接入 ADO 后换成 work item ID，机械替换 YAML key 与场景标题即可。 */
const CASE_ID_PATTERN = /^TRADE-\d{3}$/;

let validated = false;

function doc(): TradeCasesDoc {
  const d = loadYaml<TradeCasesDoc>(TRADE_CASES_FILE);
  if (!validated) {
    assertCaseIdPattern(d.cases, CASE_ID_PATTERN, TRADE_CASES_FILE);
    validated = true;
  }
  return d;
}

export function getCreateTradeCase(caseId: string): CreateTradeCase {
  return pickCase(doc().cases, caseId, TRADE_CASES_FILE);
}

/** Outline 按 productType 取该类产品的默认用例（defaults 映射显式维护） */
export function getDefaultTradeCase(productType: ProductType): CreateTradeCase {
  const { defaults } = doc();
  const caseId = defaults[productType];
  if (!caseId) {
    throw new Error(
      `No default case for product type '${productType}'. Configured: ${Object.keys(defaults).join(', ')}`,
    );
  }
  return getCreateTradeCase(caseId);
}

/** 按产品类型解析 .dat 捕获文件路径；文件缺失时立刻报错而非让上传静默失败 */
export function datFileFor(productType: ProductType): string {
  const file = path.join(DAT_DIR, `${productType}.dat`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing .dat capture file for product type '${productType}': ${file}`);
  }
  return file;
}
