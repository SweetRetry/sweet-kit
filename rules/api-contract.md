# API Contract 规则

本规则约束 HTTP API 的描述层与错误层。描述层沿用 **OpenAPI 3.1**（由 zod schema 派生）；错误层遵循 **RFC 9457 Problem Details**。

## 契约

1. **单一真源**：`/openapi.json` 由 `apps/server` 的 zod schema 派生（`@hono/zod-openapi`）。不手写 spec，不提交静态副本。
2. **错误即 problem details**：所有非 2xx 响应体是 RFC 9457 Problem Details，媒体类型 `application/problem+json`。
3. **`code` 是客户端唯一判据**：`ErrorCode` 与 `type` 的最后一段一一对应，`status` 与 HTTP 状态码由同一个 `code` 映射决定；三者不属于独立可变的轴。
4. **构建集中在 `packages/request`**：服务端只调用 `problemResponse(c, code, detail)`；`type`、`title`、`status` 由 `code` 推导，调用方不手写。
5. **不泄漏内部信息**：`detail` 说明调用方如何纠正，不含堆栈或 SQL；`traceId` 只在 `INTERNAL_SERVER_ERROR` 出现，用于日志关联。

## 标准成员映射

`packages/request/src/contract.ts` 是成员取值的唯一真源，此表只固定语义：

| RFC 9457 成员 | 取值来源 | 约束 |
| --- | --- | --- |
| `type` | `PROBLEM_TYPE_PREFIX` + slug | problem 的主标识符；稳定、绝对，发布后不改 |
| `title` | 由 `code` 派生的固定摘要 | 同类问题稳定，不随单次发生而变化（§3.1.3） |
| `status` | 由 `code` 派生 | 必须与实际 HTTP 状态码一致（§3.1.2） |
| `detail` | 调用方传入 | 面向调用方，帮助其纠正问题（§3.1.4） |
| `code` | `ErrorCode` 枚举 | 扩展成员；客户端唯一判据 |
| `traceId` | 活跃 trace | 扩展成员；仅 500 |

## HTTP 状态码与 `code` 的关系

RFC 9457 只规定“生成时 `status` 必须等于 HTTP 状态码”（§3.1.2），并明确声明两者不一致时 **priority 不清楚**（§5："Their relative precedence is not clear"）。本规则补上这一半：

| 问题 | 取值 |
| --- | --- |
| 生成时 | `status` 与 HTTP 状态码强制一致（由同一个 `code` 推导） |
| 传输后不一致 | 判为**非法响应**，客户端不将就任一方向；退回通用错误，保留原始 body 在 `details` |
| 谁优先 | 不选优先方。不一致本身就是未被授权的响应，不需要猜测 |
| 一个状态多个 code | 允许（RFC 注册表即按状态归类），但每个 code 只能对应一个状态 |

这是对 RFC 的有意收窄：协议把一致性义务给了生成方，把歧义留给了消费方；本项目选择让歧义在客户端边界上被发现，而不是被默默容忍。

## 新增错误类型的门

先过 RFC 9457 §4 的判断，再动代码：

1. **状态码已自解释？** （例：`PUT` 被拒的 403、资源不存在的 404）——是则不加新 code。RFC 原话：truly generic problems "are usually better expressed as plain status codes"。
2. **它是新的语义类别，还是同一类的多个实例？** 多个字段的校验失败属于后一种，用扩展数组成员承载，不拆成多个 code；一次响应只描述一个问题（§3 建议取最相关的一个）。
3. **通过后**：先加 `ErrorCode`，再补 status / title / slug 三张映射（`satisfies` 强制穷尽），最后写路由。改名或删除已发布的 `code` 与 `type` 属于破坏性变更。
4. **扩展成员命名**：以字母开头、三位以上、只含字母数字与 `_`（§4 的 SHOULD）按此约定，`code`、`traceId` 合规；新成员不得用连字符或点号。

## `type` URI 的文档义务

RFC 9457 §4 要求每个 problem type 定义必须记录 type URI、title 与配套状态码，且 type URI **SHOULD 能解析到解释如何解决该问题的 HTML 文档**。因此每个 `type` 都有说明义务：触发条件与调用方修正方式写在 [docs/api-errors.md](../docs/api-errors.md)（不重复 code/title/status，那些以 `contract.ts` 为真源），新增 code 而不同步说明属于未完成。

## 与 spec 的分工

新增 endpoint、字段与错误类型的**决策**写在 spec（to-spec skill 的 Implementation Decisions）。本规则只固定跨特性的不变量。

## 门禁

- **契约测试**（`packages/request/test/`）：`code` ↔ `type` 一一对应、每个 code 的 status/title/slug 完备、`traceId` 只随 500、客户端拒绝不一致的 problem details。本规则的主要验证面就是这些不变量——它们断言语义，不断言源码写法。
- **类型层**（`pnpm typecheck`）：三张映射用 `satisfies Record<ErrorCode, ...>` 强制穷尽。
- **不做源码扫描**：如“非 2xx 的媒体类型”这类结论只在运行期（生成的 `/openapi.json`）成立，用正则推断源码会同时产生误报与漏报；这部分由验收清单人工判定。

## 验收

- [ ] 非 2xx 响应的媒体类型是 `application/problem+json`，且 `status` 与 HTTP 状态码一致。
- [ ] 客户端只用 `code` 判定错误；未知 `code` 不套用已知语义。
- [ ] 新增 `ErrorCode` 时三张映射同时更新，`pnpm test` 通过。
- [ ] 受保护路由声明 `security`，每个响应状态声明内容 schema。
- [ ] 错误体不含堆栈、SQL、内部主机名等调试信息。
- [ ] 新增 `code` 前先回答：HTTP 状态码是否已经说清这个错误？若能说清则不新增。
- [ ] 每个新增 `type` 在 [docs/api-errors.md](../docs/api-errors.md) 有对应说明（触发条件与调用方修正方式）。
