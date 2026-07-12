import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'yaml';

/**
 * 通用的用例数据加载器：test-data/ 下全部 YAML 汇入一张全局索引，
 * 取数只凭键（caseId / preset 别名），不需要指明数据种类或所在文件。
 *
 * 组织约定（三级，防止数据堆在一起）：
 *   test-data/<module>/ 模块目录 → 每种数据一个文件或目录（形状不同即分家；
 *   量大时文件原地升级为分片目录）→ 文件内 presets/cases 两命名空间。
 *   文件怎么组织是数据侧的自由——索引扫描整棵目录树，移动/拆分/新增文件，
 *   取数代码零改动。
 *
 * 并行安全：
 *   - YAML 是只读输入，按文件缓存（每个 worker 进程各有一份缓存，互不可见）
 *   - getCase/getPreset 返回 structuredClone 深拷贝——场景步骤改了数据也只影响
 *     本场景的副本，不会污染同 worker 后续场景（这是共享缓存最隐蔽的串数据途径）
 *   - 运行时产生的数据（tradeId 等）一律走场景级 ctx，与静态输入分离
 */
const cache = new Map<string, unknown>();

/**
 * 读取并缓存整个 YAML 文档。
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
 * 单个数据文件的文档形状：**顶层键即命名空间**。
 * cases——caseId → 参数（数据本身是被测行为时，经场景标题绑定；全局唯一的一个命名空间）；
 * <kind>_preset——业务别名 → 参数模板（前置造数；每种数据自带命名空间，如
 * trade_preset / cancel_preset，别名只需命名空间内唯一——两边都可以叫 standard）。
 */
export type CaseDoc<T> = Record<string, Record<string, T> | undefined>;

/* ---------- 全局索引：caseId / 命名空间+preset 别名 → 数据（通用取数入口） ---------- */

/**
 * 首次取数时懒加载 test-data/ 下**全部** YAML，建索引（每 worker 进程一次，
 * 进程内缓存）。顶层键只允许两种形态，其余键报错（拦截 typo，避免数据静默失踪）：
 *   - cases：caseId 跨全部文件全局唯一——模块前缀即命名空间（TRADE-001 /
 *     PRODUCT-001，各模块只在自己的文件里编号），结构上不会撞号；命名模式建索引
 *     时校验（将来接入 ADO 换成纯数字 work item ID 时，只需改这一处模式）
 *   - <kind>_preset：别名在该命名空间内跨文件唯一即可，跨命名空间随意重名
 * 重复键建索引时报错并指明两个来源文件；文件内重复由 YAML 解析器直接拒绝。
 */
const TEST_DATA_ROOT = 'test-data';
const CASE_ID_PATTERN = /^[A-Z][A-Z0-9_]*-\d+$/;
const PRESET_NAMESPACE_PATTERN = /^[a-z][a-z0-9_]*_preset$/;

interface IndexedEntry {
  data: unknown;
  source: string;
}

interface DataIndex {
  cases: Map<string, IndexedEntry>;
  /** 命名空间（YAML 顶层键，如 trade_preset）→ 别名 → 数据 */
  presets: Map<string, Map<string, IndexedEntry>>;
}

let dataIndex: DataIndex | undefined;

function yamlFilesUnder(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return yamlFilesUnder(full);
      return /\.ya?ml$/.test(entry.name) ? [full] : [];
    });
}

function buildDataIndex(): DataIndex {
  const root = path.resolve(__dirname, '../../');
  const index: DataIndex = { cases: new Map(), presets: new Map() };
  for (const file of yamlFilesUnder(path.join(root, TEST_DATA_ROOT))) {
    const relative = path.relative(root, file);
    const doc = loadYaml<CaseDoc<unknown> | null>(relative);
    for (const [namespace, entries] of Object.entries(doc ?? {})) {
      if (entries == null) continue;
      let target: Map<string, IndexedEntry>;
      if (namespace === 'cases') {
        target = index.cases;
      } else if (PRESET_NAMESPACE_PATTERN.test(namespace)) {
        target = index.presets.get(namespace) ?? new Map();
        index.presets.set(namespace, target);
      } else {
        throw new Error(
          `Unknown top-level key '${namespace}' in ${relative} — expected 'cases' or '<kind>_preset' (e.g. trade_preset)`,
        );
      }
      for (const [key, data] of Object.entries(entries)) {
        if (namespace === 'cases' && !CASE_ID_PATTERN.test(key)) {
          throw new Error(
            `Invalid case id '${key}' in ${relative} — expected <MODULE>-<number> (pattern ${CASE_ID_PATTERN}, e.g. TRADE-001)`,
          );
        }
        const existing = target.get(key);
        if (existing) {
          throw new Error(
            `Duplicate ${namespace} key '${key}' in ${relative} — already defined in ${existing.source}`,
          );
        }
        target.set(key, { data, source: relative });
      }
    }
  }
  return index;
}

/**
 * 按 caseId 取用例数据（深拷贝）。通用入口本身无类型——
 * 类型由调用方（通常是领域 fixture，如 getCase<CreateTradeCase>）一次性泛型收口。
 */
export function getCase<T>(caseId: string): T {
  dataIndex ??= buildDataIndex();
  const entry = dataIndex.cases.get(caseId);
  if (!entry) {
    throw new Error(
      `Unknown case '${caseId}' under ${TEST_DATA_ROOT}/. Available: ${[...dataIndex.cases.keys()].join(', ')}`,
    );
  }
  return structuredClone(entry.data) as T;
}

/**
 * 按 命名空间（YAML 顶层键）+ 业务别名 取 preset 模板（深拷贝）：
 * 前置造数、与被测行为无关的数据。命名空间是数据（关键字传入），
 * 不是函数——新增数据种类零新函数；类型同样在调用点泛型收口。
 */
export function getPreset<T>(namespace: string, presetName: string): T {
  dataIndex ??= buildDataIndex();
  const aliases = dataIndex.presets.get(namespace);
  if (!aliases) {
    throw new Error(
      `Unknown preset namespace '${namespace}' under ${TEST_DATA_ROOT}/. Available: ${[...dataIndex.presets.keys()].join(', ')}`,
    );
  }
  const entry = aliases.get(presetName);
  if (!entry) {
    throw new Error(
      `Unknown preset '${presetName}' in ${namespace}. Available: ${[...aliases.keys()].join(', ')}`,
    );
  }
  return structuredClone(entry.data) as T;
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
