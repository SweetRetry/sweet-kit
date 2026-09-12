# Zod v4 规则

本项目使用 Zod v4。生成代码时使用 v4 API，不写 v3 模式。实际安装版本以各 workspace `package.json` 的 `zod` 依赖与 `pnpm-lock.yaml` 为准。

## 字符串格式校验：使用 standalone 构造器

v4 为格式校验提供独立构造器，产出专属类型（如 `ZodEmail`）而非 `ZodString` + check 组合。

| 不推荐（v3 写法） | 本项目使用 |
|---|---|
| `z.string().email()` | `z.email()` |
| `z.string().url()` | `z.url()` |
| `z.string().uuid()` | `z.uuid()` |
| `z.string().ip()` | `z.ipv4()` / `z.ipv6()` |
| `z.string().emoji()` | `z.emoji()` |
| `z.string().nanoid()` | `z.nanoid()` |
| `z.string().cuid()` / `.cuid2()` | `z.cuid()` / `z.cuid2()` |
| `z.string().ulid()` | `z.ulid()` |
| `z.string().base64()` | `z.base64()` |
| `z.string().datetime()` / `.date()` / `.time()` | `z.iso.datetime()` / `z.iso.date()` / `z.iso.time()` |

## 已废弃 API

| 废弃 | 替代 |
|---|---|
| `z.nativeEnum(MyEnum)` | `z.enum(MyEnum)` — 直接接受 TS enum 与 object |
| `z.ostring()` / `z.onumber()` / `z.oboolean()` | `z.optional(z.string())` |
| `z.TypeOf<T>` / `z.Infer<T>` | `z.infer<T>` |
| `z.ZodTypeAny` / `z.ZodSchema` / `z.Schema` | `z.ZodType` |
| `ZodIssueCode.xxx` | 字符串字面量，如 `"invalid_type"` |
| `setErrorMap(map)` / `getErrorMap()` | `z.config({ customError: map })` / `z.config().customError` |
| `schema.deepPartial()` | `z.deepPartial(schema)` — 方法形式已移除 |

## 破坏性变更

- `z.record()` 必须传 key 与 value 两个参数：`z.record(z.string(), z.string())`；key 不需穷尽时用 `z.partialRecord()`。
- `z.function()` 改为对象或链式签名：`z.function({ input: [...], output })`。
- 错误消息统一用 `error` 字段，替代 `message`：`z.string().min(5, "Too short")`、`z.enum([...], { error: "..." })`、`.refine(fn, { error: "..." })`。
- `.default()` 的值必须匹配 output 类型；值匹配 input 并需经过 transform 时用 `.prefault()`。
- `z.number()` 拒绝 `Infinity`；`.int()` 只接受 safe integer。
- `.deepPartial()` 方法移除，改用顶层 `z.deepPartial(schema)`；`.exactPartial()` 区分缺失 key 与显式 `undefined`。
- `z.iso.datetime()` 按 RFC 3339 要求秒；字符串 `.min()` / `.max()` / `.length()` 按 Unicode code point 计数。
- 对象与 record 始终移除 `__proto__` key。

## v4 提供的其他能力

只列能力名，具体签名以官方文档与类型定义为准：

- 环境变量解析：`z.stringbool()`、`z.coerce.*`
- 数值：`z.int()`、`z.int32()` / `z.uint32()` / `z.int64()` / `z.uint64()`、`z.float32()` / `z.float64()`
- 结构：`z.strictObject()` / `z.looseObject()`、`z.xor()`、`z.looseRecord()`、`z.exactOptional()` / `z.nonoptional()`
- 组合与转换：`z.pipe()`、`z.codec()`、`z.input()` / `z.output()`、`z.templateLiteral()`
- 校验与元数据：`z.check()`、`z.describe()` / `z.meta()`、`z.registry()` / `z.globalRegistry`、`z.properties()`、`z.json()`
- 其他类型：`z.file()`、`z.creditCard()`、`z.jwt()`、`z.e164()`、`z.mac()`、`z.hostname()`、`z.hex()`、`z.cidrv4()` / `z.cidrv6()`、`z.xid()` / `z.ksuid()`、`z.uuidv4()` / `z.uuidv6()` / `z.uuidv7()`、`z.guid()`、`z.httpUrl()`
- 互转：`z.toJSONSchema()` / `z.fromJSONSchema()`
- 布尔快速路径：`z.validate()` / `z.validateAsync()` — 不需要解析结果或错误详情时使用
- 编译：`z.compile()` — 只在有基准或 profiling 证据的高频校验路径使用；应用级自动编译需入口 `import "zod/compile"`

## 自动化验证

修改 Schema 或数据校验代码后运行：

```bash
pnpm zod:check
```
