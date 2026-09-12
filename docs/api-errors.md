# API 错误说明

错误契约遵循 RFC 9457，取值真源在 `packages/request/src/contract.ts`（`type`、`title`、`status` 由 `code` 推导）。本文件只记录代码无法表达的部分：**触发条件**与**调用方该怎么处理**。RFC 9457 §4 要求 `type` URI 应能解析到这类说明。

| `code` | 触发条件 | 调用方处理 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 请求体、查询参数或路径参数未通过 schema 校验 | 读 `detail` 修正输入后重试；不要把该错误当作可重试的瞬时故障 |
| `UNAUTHORIZED` | 缺少凭据、凭据过期或凭据无效 | 走登录流程或刷新 token 后重试；CLI 场景触发 device authorization |
| `FORBIDDEN` | 凭据有效，但当前身份无权访问该资源 | 不重试；向用户说明权限不足 |
| `NOT_FOUND` | 目标资源不存在，或对当前身份不可见 | 不重试；回到上一级列表或提示资源已删除 |
| `CONFLICT` | 请求与当前资源状态冲突（如并发写入、唯一键冲突） | 重新拉取最新状态后由用户确认再重试 |
| `INTERNAL_SERVER_ERROR` | 服务端未预期的失败 | 可退避重试；携带 `traceId` 反馈，用于日志关联 |

## 约定

- `code` 是客户端唯一判据；`type` 的最后一段与它一一对应。未知 `code` 一律按通用错误处理，不套用已知语义。
- `status` 必须等于实际 HTTP 状态码。两者不一致时该响应不视为本契约（见 `rules/api-contract.md`）。
- `traceId` 只在 `INTERNAL_SERVER_ERROR` 出现，用于关联服务端日志。
- 状态码已经自解释的错误（如普通 403、404）不再新增 `code`；新增 `code` 前先回答"HTTP 状态码是否已经说清"。
