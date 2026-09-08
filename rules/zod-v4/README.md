# Zod v4 规则

本项目使用 Zod v4。实际安装版本以各 workspace `package.json` 中的 `zod` 依赖和 `pnpm-lock.yaml` 为准。生成代码时必须使用 v4 API，避免已废弃的 v3 模式。

## 字符串格式校验：优先使用 standalone 构造器

v4 新增独立类型构造器，产出专属类型（如 `ZodEmail`），而非 `ZodString` + check 的组合。两种写法均可工作，但 standalone 是推荐方式。

| v3 写法（仍可用但非推荐） | v4 推荐写法 |
|---|---|
| `z.string().email()` | `z.email()` |
| `z.string().url()` | `z.url()` |
| `z.string().uuid()` | `z.uuid()` |
| `z.string().ip()` | `z.ipv4()` / `z.ipv6()` |
| `z.string().emoji()` | `z.emoji()` |
| `z.string().nanoid()` | `z.nanoid()` |
| `z.string().cuid()` | `z.cuid()` |
| `z.string().cuid2()` | `z.cuid2()` |
| `z.string().ulid()` | `z.ulid()` |
| `z.string().base64()` | `z.base64()` |
| `z.string().datetime()` | `z.iso.datetime()` |
| `z.string().date()` | `z.iso.date()` |
| `z.string().time()` | `z.iso.time()` |
| — | `z.iso.duration()` |

额外 v4 新增 standalone（无 v3 对应）：

- `z.uuidv4()`, `z.uuidv6()`, `z.uuidv7()`
- `z.httpUrl()` — 仅允许 http/https 协议
- `z.guid()`
- `z.base64url()`
- `z.e164()` — E.164 电话号码
- `z.jwt()`
- `z.xid()`, `z.ksuid()`
- `z.mac()` — MAC 地址
- `z.cidrv4()`, `z.cidrv6()`
- `z.hostname()`, `z.hex()`

## 已废弃 API

| 废弃 | 替代 |
|---|---|
| `z.nativeEnum(MyEnum)` | `z.enum(MyEnum)` — enum() 现在直接接受 TS enum 和 object |
| `z.ostring()` / `z.onumber()` / `z.oboolean()` | `z.optional(z.string())` 或 `z.string().optional()` |
| `z.TypeOf<T>` / `z.Infer<T>` | `z.infer<T>` |
| `z.ZodTypeAny` / `z.ZodSchema` / `z.Schema` | `z.ZodType` |
| `ZodIssueCode.xxx` | 直接使用字符串字面量 `"invalid_type"` 等 |
| `ZodFirstPartyTypeKind` | 已清空为空 enum stub |
| `setErrorMap(map)` | `z.config({ customError: map })` |
| `getErrorMap()` | `z.config().customError` |
| `schema.deepPartial()` | `z.deepPartial(schema)`；方法形式已移除，使用顶层函数 |

## 破坏性变更

### z.record() 必须传两个参数

```ts
// v3（已不可用）
z.record(z.string())

// v4
z.record(z.string(), z.string())

// v4 新增：partialRecord 不要求 key 穷尽
z.partialRecord(z.enum(["a", "b"]), z.number())
```

### z.function() API 变更

```ts
// v3
z.function().args(z.string(), z.number()).returns(z.boolean())

// v4
z.function({ input: [z.string(), z.number()], output: z.boolean() })
// 或链式
z.function().input([z.string(), z.number()]).output(z.boolean())
```

### error 消息参数统一

v4 使用 `error` 替代 v3 的 `message`（`message` 在部分位置仍兼容但非推荐）：

```ts
// v4 推荐：字符串简写
z.string().min(5, "Too short")
z.email("Invalid email")

// v4 推荐：对象形式用 error 字段
z.enum(["a", "b"], { error: "Must be a or b" })
z.number().gte(5, { error: (iss) => `Min: ${iss.minimum}` })

// v4：refine 使用 error
.refine(fn, { error: "Validation failed" })

// v4：parse 时传 error map
schema.safeParse(data, { error: customErrorMap })
```

### .default() 行为变更

```ts
// v4：.default() 值必须匹配 output 类型
z.string().transform(v => v.length).default(0)

// v4 新增 .prefault()：值匹配 input 类型，会经过 transform
z.string().transform(v => v.length).prefault("tuna") // => 4
```

### 数值类型限制

- `Infinity` / `-Infinity` 被 `z.number()` 拒绝
- `.int()` 仅接受 safe integer（`Number.MIN_SAFE_INTEGER` ~ `Number.MAX_SAFE_INTEGER`）

### z.object() 行为

- 默认行为为 strip（去除未知 key），与 v3 一致
- `.strict()` / `.passthrough()` / `.strip()` / `.merge()` / `.extend()` / `.pick()` / `.omit()` / `.partial()` 仍可用
- `.deepPartial()` 方法已移除；递归可选使用 `z.deepPartial(schema)`，返回值仍为 `ZodObject`
- `.exactPartial()` 允许省略 key，但拒绝显式传入 `undefined`
- 新增顶层 `z.strictObject()` 和 `z.looseObject()`

### 验证语义

- `z.iso.datetime()` 按 RFC 3339 校验时要求秒；如需同时接受分钟精度，显式组合对应精度的 schema
- 字符串 `.min()` / `.max()` / `.length()` 按 Unicode code point 计数，不按 UTF-16 code unit 计数
- `z.object()` 支持声明 symbol key；未声明的 symbol key 仍会被忽略
- 对象与 record 始终移除 `__proto__` key；strict object 会将输入自有的 `__proto__` 报为 `unrecognized_keys`

## v4 新增 API

### z.compile()

对重复执行的 schema 可显式编译，编译结果保留原 schema 的类型和解析 API，原 schema 不变：

```ts
const User = z.object({
  id: z.uuid(),
  name: z.string(),
})

const CompiledUser = z.compile(User)
CompiledUser.parse(input)
```

- 只在有基准或 profiling 证据的高频校验路径使用，不为一次性解析增加编译层
- 默认无法编译的 schema 会继续使用 runtime parser；需要保证 schema 可编译时传入 `{ strict: true }`
- async、encode 和 `skipChecks` 路径不使用编译 fast path
- 如需应用级自动编译，入口最先 `import "zod/compile"`；只有应用级基准证明收益时才启用

### z.validate() / z.validateAsync()

只需要判断输入是否合法、不需要解析结果或错误详情时使用 boolean fast path：

```ts
if (z.validate(User, input)) {
  // input 已收窄为 User 的 input 类型
}
```

包含 async refinement 或 transform 的 schema 使用 `await z.validateAsync(schema, input)`。

### 数值类型构造器

- `z.int()` — 安全整数
- `z.float32()`, `z.float64()`
- `z.int32()`, `z.uint32()`
- `z.int64()`, `z.uint64()` — BigInt 范围

### z.stringbool()

将字符串布尔值转换为 boolean，适用于环境变量解析：

```ts
const strbool = z.stringbool()
strbool.parse("true")  // => true
strbool.parse("1")     // => true
strbool.parse("false") // => false
strbool.parse("0")     // => false
```

### z.file()

验证 File 实例：

```ts
z.file().min(1024).max(5_000_000).mime("image/png")
```

### z.creditCard()

校验 12–19 位、可用单个空格或连字符分隔且通过 Luhn checksum 的银行卡号：

```ts
z.creditCard().parse("4111 1111 1111 1111")
```

### z.pipe() 和 z.codec()

```ts
// pipe：单向转换链
z.pipe(z.string(), z.coerce.number())

// codec：双向转换（parse + encode）
z.codec(inputSchema, outputSchema)
```

### z.check()

独立 check 函数，可用于 `.check()` 方法：

```ts
const positiveCheck = z.check<number>((val) => {
  if (val <= 0) return { error: "Must be positive" }
})
z.number().check(positiveCheck)
```

### z.describe() / z.meta()

附加元数据到 schema，用于 JSON Schema 生成：

```ts
z.string().check(z.describe("User's email"))
z.number().check(z.meta({ title: "Age", description: "User's age" }))
```

### z.registry() / z.globalRegistry

Schema 注册表，管理 schema 元数据：

```ts
const myRegistry = z.registry<{ title: string }>()
myRegistry.register(mySchema, { title: "User" })
z.globalRegistry.register(mySchema, { description: "..." })
```

### z.xor()

互斥 union — 恰好匹配一个分支：

```ts
z.xor([z.object({ a: z.string() }), z.object({ b: z.number() })])
```

### z.partialRecord() / z.looseRecord()

```ts
// partialRecord：key 不要求穷尽
z.partialRecord(z.enum(["a", "b"]), z.number())
// looseRecord：宽松匹配
z.looseRecord(z.string(), z.number())
```

### z.deepPartial() / .exactPartial()

```ts
const PartialUser = z.deepPartial(User)
const ExactPartialUser = User.exactPartial()
```

`z.deepPartial()` 递归地将对象字段变为可选；`.exactPartial()` 区分缺失 key 与值为 `undefined`。

### z.exactOptional()

区分 `undefined` 和 key 不存在：

```ts
z.object({ name: z.exactOptional(z.string()) })
// { name: undefined } => 失败
// {} => 成功
```

### z.nonoptional()

强制 key 存在：

```ts
z.object({ name: z.nonoptional(z.string()) })
```

### z.templateLiteral()

模板字面量类型校验：

```ts
z.templateLiteral(["user_", z.number()])
// 匹配 "user_1", "user_42" 等
```

### z.json()

验证 JSON-compatible value，包括 string、number、boolean、null、数组和 string-keyed object；不接受 `undefined`、`Date`、`Symbol` 等值。它不解析 JSON 字符串。

### z.properties()

在一个 `.check()` 中校验实例的多个属性：

```ts
const HttpsUrl = z.instanceof(URL).check(
  ...z.properties({
    protocol: z.literal("https:" as string),
    hostname: z.string().regex(z.regexes.domain),
  })
)
```

### z.input() / z.output()

将包含 codec 或 pipe 的 schema 投影到输入侧或输出侧，分别校验转换前后的数据：

```ts
z.input(schema).parse(encodedValue)
z.output(schema).parse(decodedValue)
```

### z.toJSONSchema() / z.fromJSONSchema()

Schema 与 JSON Schema 互转。

### z.coerce 命名空间

与 v3 一致：`z.coerce.string()`, `z.coerce.number()`, `z.coerce.boolean()`, `z.coerce.bigint()`, `z.coerce.date()`。

## 自动化验证

修改 Schema 或数据校验代码后，运行静态检查脚本验证废弃 API：

```bash
pnpm zod:check
```

