import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'yaml';

/**
 * 通用的用例数据 YAML 加载器。
 *
 * 组织约定（三级，防止数据堆在一起）：
 *   test-data/<module>/ 模块目录 → 每种数据一个文件或目录（loadCaseDoc，
 *   形状不同即分家；量大时文件升级为分片目录）→ 文件内 presets/cases 两命名空间。
 * 各模块提供自己的类型化访问函数（见 trade-cases.ts），跨模块只经访问函数取数。
 *
 * 并行安全：
 *   - YAML 是只读输入，按文件缓存（每个 worker 进程各有一份缓存，互不可见）
 *   - pickCase 返回 structuredClone 深拷贝——场景步骤改了数据也只影响本场景的
 *     副本，不会污染同 worker 后续场景（这是共享缓存最隐蔽的串数据途径）
 *   - 运行时产生的数据（tradeId 等）一律走场景级 ctx，与静态输入分离
 */
const cache = new Map<string, unknown>();

/**
 * 读取并缓存整个 YAML 文档（模块自行定义文档结构，如 presets + cases）。
 * merge: true 启用合并键（<<: *anchor）——变体 preset 继承基线、只声明差异。
 */
export function loadYaml<T>(relativeFile: string): T {
  let doc = cache.get(relativeFile);
  if (doc === undefined) {
    const absolute = path.resolve(__dirname, '../../', relativeFile);
    doc = parse(fs.readFileSync(absolute, 'utf8'), { merge: true });
    cache.set(relativeFile, doc);
  }
  return doc as T;
}

/**
 * 一"种"用例数据的通用文档形状：两个命名空间。
 * presets——业务别名 → 参数模板（前置造数、与被测行为无关的数据）；
 * cases——caseId → 参数（该数据种类本身是被测行为时，经场景标题绑定）。
 * 两者都可省略（纯 preset 文件不需要 cases，反之亦然）。
 */
export interface CaseDoc<T> {
  presets?: Record<string, T>;
  cases?: Record<string, T>;
}

const docCache = new Map<string, unknown>();

/**
 * 加载一种用例数据。relativePath 可以是单个 YAML 文件，也可以是目录：
 * 数据量大时把文件原地升级为同名目录，内部任意拆成多个同构分片
 * （按功能面/产品线分文件），加载时合并 presets/cases 两个命名空间——
 * 访问函数只改这里的一个路径常量，调用方零改动。
 *
 * 跨文件重名（YAML 解析器只能挡住单文件内的 duplicate key）在合并时
 * 检测并指明两个来源文件。注意：锚点（&x / *x）不跨文件——继承链
 * 必须写在同一个分片里，这也是 presets 通常独占一个分片的原因。
 */
export function loadCaseDoc<T>(relativePath: string): Required<CaseDoc<T>> {
  let doc = docCache.get(relativePath) as Required<CaseDoc<T>> | undefined;
  if (doc !== undefined) return doc;

  const absolute = path.resolve(__dirname, '../../', relativePath);
  const files = fs.statSync(absolute).isDirectory()
    ? fs
        .readdirSync(absolute)
        .filter((name) => /\.ya?ml$/.test(name))
        .sort()
        .map((name) => path.join(relativePath, name))
    : [relativePath];
  if (files.length === 0) {
    throw new Error(`No YAML files found in ${relativePath}`);
  }

  doc = { presets: {}, cases: {} };
  const origin = new Map<string, string>();
  for (const file of files) {
    const part = loadYaml<CaseDoc<T>>(file);
    for (const namespace of ['presets', 'cases'] as const) {
      for (const [key, value] of Object.entries(part[namespace] ?? {})) {
        const existing = origin.get(`${namespace}:${key}`);
        if (existing !== undefined) {
          throw new Error(
            `Duplicate ${namespace} key '${key}' in ${file} — already defined in ${existing}`,
          );
        }
        origin.set(`${namespace}:${key}`, file);
        doc[namespace][key] = value;
      }
    }
  }
  docCache.set(relativePath, doc);
  return doc;
}

/**
 * 校验模块数据文件的所有 caseId 符合该模块的命名模式。
 * 自管编号的跨模块唯一性由结构保证：模块前缀即命名空间（TRADE-001 / PRODUCT-001），
 * 每个模块只在自己的文件里编号；文件内重复由 YAML 解析器拒绝（duplicate key 报错）。
 */
export function assertCaseIdPattern(
  cases: Record<string, unknown>,
  pattern: RegExp,
  source: string,
): void {
  const invalid = Object.keys(cases).filter((id) => !pattern.test(id));
  if (invalid.length > 0) {
    throw new Error(
      `Invalid case id(s) in ${source}: ${invalid.join(', ')} — expected pattern ${pattern}`,
    );
  }
}

/** 从 caseId → 数据 映射中取用例（深拷贝）；不存在时列出全部可用 caseId */
export function pickCase<T>(cases: Record<string, T>, caseId: string, source: string): T {
  const data = cases[caseId];
  if (data === undefined) {
    throw new Error(
      `Unknown case '${caseId}' in ${source}. Available: ${Object.keys(cases).join(', ')}`,
    );
  }
  return structuredClone(data);
}

/**
 * 从场景标题解析 caseId，支持两种约定格式：
 *   [123456] Create a plain FX TRF trade     ← ADO 风格（与 playwright-azure-reporter
 *                                               的匹配格式一致，便于将来回写 Test Plans）
 *   123456 - Create a plain FX TRF trade     ← 横线分隔风格
 * caseId 本体不限形态（ADO 纯数字或自管的 TC-xxx 均可），唯一性由编号源头保证。
 */
const TITLE_CASE_ID_BRACKET = /^\[([^\]]+)\]\s*/;
const TITLE_CASE_ID_DASH = /^(\S+)\s+-\s+/;

export function caseIdFromTitle(title: string): string {
  const match = TITLE_CASE_ID_BRACKET.exec(title) ?? TITLE_CASE_ID_DASH.exec(title);
  if (!match) {
    throw new Error(
      `Scenario title must start with '[<caseId>] ' or '<caseId> - ' to use case data ` +
        `(e.g. "[123456] Create a TRF trade" or "123456 - Create a TRF trade"), got: "${title}"`,
    );
  }
  return match[1];
}
