# HTTP API 契约

描述使用 OpenAPI 3.1，错误响应使用 RFC 9457 Problem Details；HTTP 方法与状态遵循 RFC 9110。以下固定项目约定。

适用于应用控制的 API 出口；`/api/auth/*` 由 Better Auth 协议接管，代理或网关生成的响应不由本规则保证。

## 描述与成功响应

- `/openapi.json` 从服务端 Zod schema 派生，不手写 spec 或提交静态副本。
- 成功直接返回公开的资源或操作结果，不加 `{ success, code, message, data }` 通用包装；失败使用对应的 HTTP 错误状态。
- JSON 使用 `application/json`，文件与流声明实际媒体类型；只暴露公开 schema 字段。
- OpenAPI 与实际状态、响应头、媒体类型和响应体一致；无响应体时不声明 `content`。

| 状态 | 使用边界 |
| --- | --- |
| `200` | 读取或操作完成并返回结果；集合无匹配项返回空集合，不返回 404 或 204 |
| `201` | 已创建资源；通过 `Location` 或目标请求 URI 标识主要新资源 |
| `202` | 已接受但未完成；说明处理状态与结果获取方式，不表示后台操作成功 |
| `204` | 已完成且无需响应体；不发送 JSON、`null` 或空对象 |

列表只有数据时直接返回数组；需要分页等元数据时由 endpoint 定义结构，不预设全局包装。

## 路径、方法与重试

- 资源路径表达对象，方法表达操作；非 CRUD 操作用 `POST /resources/{id}/action`，不新增动词式顶层路径。
- 部分更新用 `PATCH`，全量替换用 `PUT`；项目的 `GET`、`PUT`、`PATCH`、`DELETE` 保持幂等，重复调用不产生新的业务副作用，重复删除可返回 404。
- `POST` 不承诺幂等；需要重试的写操作明确幂等键或唯一约束。重试结合方法、操作语义与 `Retry-After`，不凭错误状态自动执行。
- 版本与兼容策略见 [ADR 0005](../docs/adr/0005-http-api-shape.md)。

## 错误构造与选择

- 应用控制且允许携带响应体的 4xx/5xx 使用 `application/problem+json`，覆盖路由、校验、限流和未匹配路由。
- `packages/request` 拥有错误取值与构造；服务端使用 `problemResponse(c, code, detail)`，调用方不手写 `type`、`title`、`status`。
- 完整 `type` URI 标识问题类型，`code` 是一一对应的 SDK 别名；`type`、`title`、`status` 从同一个 `code` 推导，实际 HTTP 状态与之匹配。
- `detail` 面向调用方说明问题与纠正方式，不泄漏堆栈、SQL 或内部设施；错误体 `traceId` 仅随 `INTERNAL_SERVER_ERROR` 出现，诊断出口见 [ADR 0006](../docs/adr/0006-trace-context-contract.md)。

| code | 触发语义与处理边界 |
| --- | --- |
| `VALIDATION_ERROR` | 输入不符合 schema，修正输入后再请求 |
| `UNAUTHORIZED` | 凭据缺失、无效或过期，先重新认证 |
| `FORBIDDEN` | 资源可见，但当前身份无权执行操作 |
| `NOT_FOUND` | 资源不存在，或已认证身份无权知道其存在 |
| `CONFLICT` | 与当前资源状态冲突，获取最新状态后再决定操作 |
| `TOO_MANY_REQUESTS` | 超过限流阈值，结合 `Retry-After` 退避 |
| `SERVICE_UNAVAILABLE` | 依赖未配置或暂时不可用，区分配置问题与临时故障 |
| `INTERNAL_SERVER_ERROR` | 未预期的服务端失败，用 `traceId` 关联诊断 |

认证缺失或无效时先返回 401，不借资源是否存在改变结果。保留协议要求的响应头，如 401 的 `WWW-Authenticate`、405 的 `Allow`；HEAD、204、304 等无响应体场景不强加 Problem Details。

## 客户端识别与契约演进

- 只有完整 `type` URI、`code` 与实际状态映射一致时，客户端才按已知错误处理；不能只匹配 URI 最后一段。
- 未知类型或契约不一致时保留实际 HTTP 状态和原始诊断信息，不暴露已知业务 `code`；忽略未知扩展，不解析 `title` 或 `detail` 做分支。
- 优先复用通用错误类型；仅当调用方需要区分新的语义类别时新增 code，同类问题的实例差异放在 detail 或扩展成员中。
- 新增类型同时补齐 status、title、slug 映射、测试及上表的触发语义。对外发布时提供对应 type URI 的说明文档；已发布的 `code` 与 `type` 改名或删除属于破坏性变更。

## 应用响应测试

共享不变量由 `packages/request` 的类型与契约测试守护。改动 endpoint 或中间件时，用实际请求验证状态、响应头、响应体与无响应体语义，并核对 OpenAPI 声明；只检查生成文档或扫描源码不能证明响应符合契约。
