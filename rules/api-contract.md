# API Contract 规则

本规则约束 HTTP API 的描述层、成功响应与错误响应。描述层使用 **OpenAPI**（由 Zod schema 派生）；成功响应直接表达资源或操作结果；错误响应遵循 **RFC 9457 Problem Details**。HTTP 语义以 [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) 为准，问题详情以 [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) 为准。

适用于应用控制的 API 出口；`/api/auth/*` 由 Better Auth 按其协议接管，代理或网关生成的响应不由本规则保证。内部命令通道（如 `CanvasCommandError`）在 HTTP 之外传递，不属于本规则。

## 核心契约

1. **单一真源**：`/api/openapi.json` 由 `apps/server` 的 Zod schema 经 `@hono/zod-openapi` 派生（`apps/server/src/app.ts` 的 `app.doc`，声明 OpenAPI 3.0.0），`/api/docs` 是同源文档页。不手写 spec，不提交静态副本。
2. **成功直接表达结果**：使用符合操作语义的 2xx；JSON 响应直接返回资源或操作结果，媒体类型 `application/json`。不加 `{ success, code, message, data }` 包装，也不引入通用 `SuccessResponse<T>`。
3. **错误体统一格式**：应用控制且允许携带响应体的 4xx/5xx 错误使用 RFC 9457 Problem Details，媒体类型 `application/problem+json`。
4. **构建集中在一处**：错误响应只经 `apps/server/src/http/problem-details.ts` 的 `problemResponse(c, input)` 构造，`input` 为 `{ status, title, code?, detail?, type?, invalidParams? }`；不手写错误 JSON，不另建封装层。
5. **`status` 同时决定 HTTP 状态码**：`problemResponse` 用同一个 `status` 设置响应状态码，保证 body 与状态码严格一致；`instance` 自动填 `c.req.path`。
6. **错误取值由产出它的模块声明**：面向 HTTP 的特性错误类携带 `{ code, status, title, type? }`（如 `BillingError` 及其子类、`PaymentsError`、skills 的 problem 辅助函数等），`app.onError` 把 `WorkspaceError`、`ProjectPermissionError`、`UnauthorizedError` 统一适配为 problem 响应。`code` 是调用点书写的常量字符串，没有集中枚举。
7. **公开错误类型用绝对 URI**：`https://openocto.dev/problems/<slug>`，`<slug>` 一般为 `code` 的小写连字符形式（`AUTH_REQUIRED` → `/problems/unauthorized` 是既有例外，改名属于破坏性变更）；不对外承诺的类别省略 `type`，落到 RFC 9457 的 `about:blank`。
8. **不泄漏内部信息**：`detail` 面向调用方说明问题与纠正方式，不含堆栈、SQL、内部主机名或原始 Zod 错误。错误体 `traceId` 仅随 `INTERNAL_SERVER_ERROR` 出现。

## 成功响应

成功响应的 schema 由所属应用的 endpoint 定义；字段中的业务状态（如健康检查的 `status`）属于资源数据，不替代 HTTP 状态码。

| 状态 | 使用场景与响应约定 |
| --- | --- |
| `200 OK` | 读取成功或操作完成并返回结果；返回 endpoint 声明的资源或结果，HEAD 不发送响应体 |
| `201 Created` | 已创建资源；用 `Location` 标识主要新资源，省略时目标请求 URI 必须能标识该资源 |
| `202 Accepted` | 已接受但尚未完成；说明当前处理状态与结果获取方式，不表示后台操作已成功完成 |
| `204 No Content` | 操作完成且无需响应体；不发送 JSON、`null` 或空对象（如 `c.body(null, 204)`） |

- 请求失败使用对应的 4xx/5xx，不以 `200` 加 `success: false` 或错误 `code` 表达失败。
- 集合查询无匹配项返回 `200` 与空集合，不返回 `404`/`204`。只需列表时直接返回数组；需要分页等元数据时，由 endpoint 定义包含列表与元数据的对象，不预设全局包装。
- 成功响应只含公开 schema 的字段，不直接暴露数据库内部字段。文件、流等非 JSON 响应按 endpoint 声明实际媒体类型。
- OpenAPI 按实际成功状态声明响应：有响应体时声明媒体类型与 schema，无响应体时省略 `content`。

## 路径与方法

方法语义遵循 [RFC 9110 §9](https://www.rfc-editor.org/rfc/rfc9110.html#section-9)：

- 统一前缀 `/api`（`apps/server/src/app.ts`），不引入版本段。
- **非 CRUD 操作用子资源路径**：`POST /resources/{id}/action`（如 `/orders/{id}/cancel`），不新增 `/api/cancelOrder` 这类动词式顶层路径。
- **部分更新用 `PATCH`**（merge-patch：只传要改的字段），**全量替换用 `PUT`**。
- `GET`、`PUT`、`PATCH`、`DELETE` 保持幂等，重复提交不得产生新的副作用；`DELETE` 重复调用允许返回 `404`。
- `POST` 不承诺幂等。可重试的写操作由调用方带幂等键或由唯一约束兜底，不凭错误状态盲目重试。

## 错误构造与选择

| code | 触发语义与处理边界 |
| --- | --- |
| `VALIDATION_ERROR` | 输入不符合 schema，修正输入后再请求（用 `invalidParams` 承载字段错误） |
| `UNAUTHORIZED` | 凭据缺失、无效或过期，先重新认证 |
| `FORBIDDEN` | 资源可见，但当前身份无权执行操作 |
| `NOT_FOUND` | 资源不存在，或已认证身份无权知道其存在（防止泄漏资源存在性） |
| `CONFLICT` | 与当前资源状态冲突，获取最新状态后再决定操作 |
| `TOO_MANY_REQUESTS` | 超过限流阈值，结合 `Retry-After` 退避 |
| `SERVICE_UNAVAILABLE` | 依赖未配置或暂时不可用，区分配置问题与临时故障 |
| `INTERNAL_SERVER_ERROR` | 未预期的服务端失败，用 `traceId` 关联诊断 |

- 调用方无权知道某资源是否存在时返回 `404 NOT_FOUND`，用 `403 FORBIDDEN` 会泄漏资源存在性。`403` 只用于资源对调用方可见、但该操作被拒的场景。
- 认证缺失或无效一律返回 `401`，即使目标资源不存在；资源存在性只在已认证后判断。保留协议要求的响应头（如 401 的 `WWW-Authenticate`、405 的 `Allow`）。HEAD、204、304 等无响应体场景不强加 Problem Details。

### 校验失败的出口（已知缺口）

`@hono/zod-openapi` 在路由未提供 `defaultHook` 时按框架默认返回 `{"success":false,"error":ZodError}`（`application/json`）：既不在统一错误体内，又带出 Zod 的路径与消息。新增或改写的含校验路由须自建 `OpenAPIHono` 的 `defaultHook`，把失败并入 `problemResponse`（示例：`apps/server/src/features/skills/skill-route.ts`）。既有路由尚未全部收口，属于已知缺口。

### 客户端消费

`packages/shared/src/api-client` 是唯一解析点：
- `isProblemDetails` 只认 `type: string` + `title: string` + `status: number`；命中时包装为 `ApiProblemError`（暴露 `code`、`status`、`problem`），未命中退回原始 `HTTPError`。
- 业务代码用 `isApiProblemError` 判断，分支只看 `code` / `status`，展示用 `detail` / `title`。
- 只有完整 `type` URI、`code` 与实际状态映射一致时，客户端才按已知错误处理；不能只匹配 URI 最后一段。
- 客户端忽略不认识的扩展成员，不得解析 `title` 或 `detail` 字符串内容来做逻辑分支。

### 新增错误类型判断

新增错误类型前必须经过以下判断：
1. **状态码已自解释？**（如普通 403、404）——是则复用已有响应，不为具体资源或路由另加 `code`。
2. **它是新的语义类别，还是同一类的多个实例？** 多个字段的校验失败属于后者，用 `invalidParams` 承载，不拆成多个 `code`；一次响应只描述一个问题。
3. **通过后**：在产出该错误的同一处同时给出 `status`、`title`、`type`、`code`（四者一一对应），并在对应路由的 `problemResponses({...})` 中声明该状态。改名或删除已发布的 `type` 与 `code` 属于破坏性变更。
4. **扩展成员命名**：以字母开头、三位以上、只含字母数字与 `_`；`code`、`invalidParams` 合规，新成员不得用连字符或点号。

## 验收清单

- [ ] 非 2xx 错误响应的媒体类型是 `application/problem+json`，且 body 的 `status` 与 HTTP 状态码一致。
- [ ] 错误响应经由 `problemResponse` 构造，没有手写的错误 JSON。
- [ ] 新增对外错误类型给出 `https://openocto.dev/problems/<slug>` 与同名 `code`，并在路由 spec 的 `problemResponses` 中声明对应状态。
- [ ] 不可见资源返回 `404` 而非 `403`；认证缺失或无效返回 `401`。
- [ ] 错误体不含堆栈、SQL、内部主机名与 Zod 原始错误。
- [ ] 新增 `code` 前先回答：HTTP 状态码是否已经说清这个错误？若能说清则不新增。

## 自动化验证

- **HTTP 测试**：断言状态码、`content-type` 含 `application/problem+json` 与 body 的 `status` / `code`（例：`apps/server/src/features/skills/skill-route.test.ts`）。
- **类型层**（`pnpm typecheck`）：`problemResponse` 的 `input` 类型与 `ProblemDetails` schema 约束成员形状；`problemResponses` 的返回类型约束路由 spec 的响应声明。
- **OpenAPI 快照**（`apps/server/src/app.test.ts`）：核对生成文档中的路径、状态、媒体类型与 schema 声明。
- **不做源码正则扫描**：状态码和媒体类型在运行期决定，用正则扫描源码会产生误报与漏报，由验收清单人工核对与自动化测试保障。
