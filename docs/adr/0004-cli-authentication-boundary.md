# ADR 0004：第一方 CLI 认证边界

- 状态：Accepted
- 日期：2026-08-21

## 背景

CLI 需要通过用户浏览器完成授权，并以 Bearer credential 调用 Hono API。当前 CLI 与 server 属于同一产品和信任域，不需要面向第三方 client 的授权委托、resource audience 或细粒度 scope。

## 决策

- CLI 使用 RFC 8628 device authorization 完成用户交互，通过 Better Auth Bearer plugin 使用第一方 session token 访问 API。
- Session token 只视为 Sweet Kit 第一方 client 的认证凭据，不对外声明为通用 OAuth access token。
- Server 统一验证 browser session 与 CLI Bearer session；业务 route 不自行解析或信任 token 内容。
- 在开放第三方 client、支持多个 resource server 或需要 delegated scope 前，必须重新评估认证模型，并通过新 ADR 决定是否采用 OAuth Provider。

## 结果

- CLI 不需要单独维护一套用户、session 或授权服务。
- 当前方案不提供 OAuth resource audience、client 隔离和细粒度授权语义，不能直接扩展为第三方 API access。
