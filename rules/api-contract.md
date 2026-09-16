# API Contract 规则

本规则约束 HTTP API 的描述、成功响应与错误响应。描述层用 **OpenAPI 3.1**（由 zod schema 派生）；成功响应直接表达资源或操作结果；错误响应遵循 **RFC 9457 Problem Details**。HTTP 语义以 [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) 为准，问题详情以 [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) 为准。

Schema 派生、固定 `code → status` 映射与 `traceId` 的暴露位置是项目约定，不是 REST 或 RFC 的通用要求；`traceId` 本身的形状由 W3C Trace Context 决定，标准覆盖不到的地方由这些约定补齐。取值真源见「错误响应 › 成员映射」，适用边界见文末。

## 核心契约

1. **单一真源**：`/openapi.json` 由 `apps/server` 的 zod schema 派生（`@hono/zod-openapi`）。不手写 spec，不提交静态副本。
2. **成功直接表达结果**：使用符合操作语义的 2xx；JSON 响应直接返回资源或操作结果，媒体类型 `application/json`，不加 `{ success, code, message, data }` 包装。
3. **错误体统一格式**：应用控制、允许携带响应体的 4xx/5xx 使用 RFC 9457 Problem Details，媒体类型 `application/problem+json`，覆盖路由、校验、限流与未匹配路由等应用内出口。
4. **分层判定**：实际 HTTP 状态码表达通用 HTTP 语义；完整 `type` URI 是问题类型的主标识；`code` 是项目 SDK 使用的便捷别名，与 `type` 一一对应。`type`、`title`、`status` 由同一个 `code` 推导。
5. **集中构造错误**：`packages/request` 拥有错误取值与构造函数；服务端通过 `problemResponse(c, code, detail)` 适配 HTTP 响应，不在调用方手写 `type`、`title`、`status`。
6. **不泄漏内部信息**：`detail` 说明调用方如何纠正，不含堆栈或 SQL；`traceId` 只在 `INTERNAL_SERVER_ERROR` 出现，用于日志关联。

## 成功响应

成功响应的 schema 由所属应用的 endpoint 定义，不在 `packages/request` 引入通用 `SuccessResponse<T>`。字段中的业务状态（如健康检查的 `status`）属于资源数据，不替代 HTTP 状态码。

常用状态按 [RFC 9110 §15.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3) 选择，其他 2xx 按其标准语义使用：

| 状态 | 使用场景与响应约定 |
| --- | --- |
| `200 OK` | 读取成功或操作完成并返回结果；返回 endpoint 声明的资源或结果，HEAD 不发送响应体 |
| `201 Created` | 已创建资源；用 `Location` 标识主要新资源，省略时目标请求 URI 必须能标识该资源 |
| `202 Accepted` | 已接受但尚未完成；说明当前处理状态与结果获取方式，不表示后台操作已成功完成 |
| `204 No Content` | 操作完成且无需响应体；不发送 JSON、`null` 或空对象 |

- 请求失败使用对应的 4xx/5xx，不以 `200` 加 `success: false` 或错误 `code` 表达失败。
- 集合查询无匹配项返回 `200` 与空集合，不返回 `404`/`204`。只需列表时直接返回数组；需要分页等元数据时，由 endpoint 定义包含列表与元数据的对象，不预设全局分页结构。
- 成功响应只含公开 schema 的字段，不直接暴露数据库内部字段。文件、流等非 JSON 响应按 endpoint 声明实际媒体类型，不套 JSON 包装。
- OpenAPI 按实际成功状态声明响应：有响应体时声明媒体类型与 schema，无响应体时省略 `content`；适用的 `Location` 等响应头一并声明。

## 路径与方法

方法语义遵循 [RFC 9110 §9](https://www.rfc-editor.org/rfc/rfc9110.html#section-9)，以下只固定项目取值的取舍：

- **非 CRUD 操作用子资源路径** `POST /resources/{id}/action`（如 `/orders/{id}/cancel`），不新增 `/api/cancelOrder` 这类动词式顶层路径。
- **部分更新用 `PATCH`**（merge-patch：只传要改的字段），**全量替换用 `PUT`**。`GET`、`PUT`、`PATCH`、`DELETE` 幂等，重复提交不得产生新的副作用，鉴权与限流等中间件不得破坏这一点；`DELETE` 重复调用允许返回 `404`。
- `POST` 不承诺幂等。可重试的写操作由调用方带幂等键或由唯一约束兜底，不依赖「重试一次也许没事」。

版本前缀与 REST 严格度由 [ADR 0005](../docs/adr/0005-http-api-shape.md) 决定；本规则只约束已确定形态下的表达方式。

## 错误响应

### 成员映射

`packages/request/src/contract.ts` 是成员取值的唯一真源，此表只固定语义：

| RFC 9457 成员 | 取值来源 | 约束 |
| --- | --- | --- |
| `type` | `PROBLEM_TYPE_PREFIX` + slug | 完整 URI 是 problem 的主标识，稳定绝对，发布后不改 |
| `title` | 由 `code` 派生 | 同类问题稳定，不随单次发生而变化（§3.1.3） |
| `status` | 由 `code` 派生 | 生成时必须与实际 HTTP 状态码一致（§3.1.2） |
| `detail` | 调用方传入 | 面向调用方，帮助其纠正问题（§3.1.4） |
| `code` | `ErrorCode` 枚举 | 扩展成员；项目 SDK 的问题类型别名 |
| `traceId` | 活跃 trace 的 W3C trace-id | 扩展成员；仅 500 的错误体携带；诊断响应头是 `traceparent`，见 [ADR 0006](../docs/adr/0006-trace-context-contract.md) |

### code 语义

成员映射只规定响应形状，本表规定取值何时发出、调用方如何反应：

| `code` | 触发条件 | 调用方处理 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 请求体、查询参数或路径参数未通过 schema 校验 | 读 `detail` 修正输入后重试；不当作可重试的瞬时故障 |
| `UNAUTHORIZED` | 缺少凭据、凭据过期或凭据无效 | 走登录流程或刷新 token 后重试；CLI 场景触发 device authorization |
| `FORBIDDEN` | 凭据有效，但当前身份无权执行该操作 | 不重试；向用户说明权限不足 |
| `NOT_FOUND` | 目标资源不存在，或对当前身份不可见 | 不重试；回到上一级列表或提示资源已删除 |
| `CONFLICT` | 请求与当前资源状态冲突（如并发写入、唯一键冲突） | 重新拉取最新状态后由用户确认再重试 |
| `TOO_MANY_REQUESTS` | 调用方在限流窗口内超过阈值 | 读 `Retry-After` 退避后重试；不立即重试 |
| `SERVICE_UNAVAILABLE` | 依赖未配置或暂时不可用（如部署未提供 AI provider） | 读 `detail` 判断是配置问题还是暂时不可用；不重试到恢复为止 |
| `INTERNAL_SERVER_ERROR` | 服务端未预期的失败 | 可退避重试；携带 `traceId` 反馈，用于日志关联 |

### 状态与 code 选择

- 调用方无权知道某资源是否存在时返回 `404 NOT_FOUND`，用 `403 FORBIDDEN` 会泄漏资源存在性。`403` 只用于资源对调用方可见、但该操作被拒的场景。
- 认证缺失或无效一律 `401`，即使目标资源不存在；资源存在性只在已认证后按上一行判断。

### 客户端消费

生成时 `status` 与 HTTP 状态码强制一致；代理或缓存可能造成传输后不一致（RFC 9457 §5），此时判为**契约不一致**，不按已知业务错误处理：

| 情形 | 处理 |
| --- | --- |
| 契约不一致 | 保留实际 HTTP 状态码与原始 body（`details`），不暴露已知 `code` |
| 已知问题类型 | 校验完整 `type` URI、`code` 与状态映射一致后才暴露对应 `code`；不只匹配 URI 最后一段 |
| 未知 code 或 type | 不套用已知业务语义，保留实际 HTTP 状态与诊断信息 |
| 一个状态多个 code | 允许；项目约定每个 code 只对应一个状态 |

客户端不得解析 `title`、`detail` 来分支；不认识的扩展成员应忽略，不能仅因新增扩展而拒绝响应（§3.1.4、§3.2）。

### 新增错误类型

先过 RFC 9457 §4 的判断，再动代码：

1. **状态码已自解释？**（如普通 403、404）——是则复用已有通用 code，不为具体资源或路由另加 code。
2. **它是新的语义类别，还是同一类的多个实例？** 多个字段的校验失败属于后者，用扩展数组成员承载，不拆成多个 code；一次响应只描述一个问题（§3 建议取最相关的一个）。
3. **通过后**：先加 `ErrorCode`，再补 status / title / slug 三张映射与「code 语义」表的一行（`satisfies` 强制穷尽），最后写路由。改名或删除已发布的 `code` 与 `type` 属于破坏性变更。
4. **扩展成员命名**：以字母开头、三位以上、只含字母数字与 `_`。新成员不得用连字符或点号。

RFC 9457 §4 要求每个 problem type 能解析到说明触发条件与调用方修正方式的文档，「code 语义」表就是仓库内的对应物。仓库 Markdown 不等同于 type URI 已可解析：对外发布时应提供包含这些取值的 HTML 文档，并验证 URI 可访问。新增 code 而不补表属于未完成。

## HTTP 语义边界

- HEAD 以及 204、304 等禁止内容的响应不发送响应体，不为满足统一格式添加 JSON（RFC 9110 §9.3.2、§15.3.5、§15.4.5）。1xx、3xx 不归入统一错误体规则。
- 401 必须带适用于目标资源的 `WWW-Authenticate` 挑战；405 必须带列出支持方法的 `Allow`。Problem Details 不能替代这些响应头（§15.5.2、§15.5.6）。
- 重试决策结合请求方法、幂等性与适用的 `Retry-After`，不凭某个 `code` 或 500 状态自动重试。

## 验收清单

只列自动化验证覆盖不到的部分：

- [ ] 成功状态符合操作语义，响应结构与 endpoint 的公开 schema 一致，JSON 结果没有通用成功包装；创建、异步处理、集合查询三类分支已分别验证资源标识、处理状态与结果获取方式、空集合响应。
- [ ] 路径与方法取舍符合「路径与方法」：非 CRUD 操作用子资源路径，部分更新用 `PATCH`、全量替换用 `PUT`，路径中无动词。
- [ ] 不可见资源返回 `404` 而非 `403`；认证缺失或无效返回 `401`。
- [ ] 错误体不含堆栈、SQL、内部主机名等调试信息。
- [ ] 新增 `ErrorCode` 时三张映射与「code 语义」表同时更新，`pnpm test` 通过。
- [ ] 新增 `code` 前先回答：HTTP 状态码是否已经说清这个错误？若能说清则不新增。

## 适用范围

- 覆盖本应用控制的 API 错误出口。`/api/auth/*` 由 Better Auth 按其认证协议接管；代理或网关生成的响应不由本规则保证。
- 跨特性的不变量由本规则固定。新增 endpoint、字段与错误类型的**决策**写在 spec（to-spec skill 的 Implementation Decisions）。

## 自动化验证

- **契约测试**（`packages/request/test/`）：`code` ↔ 完整 `type` 一一对应，每个 code 的 status/title/slug 完备，`traceId` 只随 500；契约不一致或类型未知时不暴露已知 code，保留实际 HTTP 状态；未知扩展不影响已知问题的识别。
- **类型层**（`pnpm typecheck`）：三张映射用 `satisfies Record<ErrorCode, ...>` 强制穷尽。
- **应用响应测试**：通过应用内请求验证本次改动涉及的成功响应及路由、中间件错误出口，检查实际状态、响应头、响应体与无响应体语义；外部依赖可注入替身。
- **OpenAPI 验证**：核对生成的 `/openapi.json` 中的状态、响应头、媒体类型、schema 与 security 声明，并与应用响应测试交叉验证。生成文档只证明声明结果，不能证明实际响应符合契约；不以源码正则扫描代替验证。
