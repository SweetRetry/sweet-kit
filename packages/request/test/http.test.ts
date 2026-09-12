import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createProblemDetails,
  ErrorCode,
  getProblemType,
  PROBLEM_MEDIA_TYPE,
} from "../src/contract.ts"
import { createRequestClient, RequestError } from "../src/http.ts"

const traceId = "11111111111111111111111111111111"

function stubProblemResponse(body: unknown, status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          headers: {
            "content-type": PROBLEM_MEDIA_TYPE,
            "x-trace-id": traceId,
          },
          status,
        })
    )
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("request error contract", () => {
  it("解析 problem details 并从 response header 关联 trace", async () => {
    const problem = createProblemDetails(ErrorCode.UNAUTHORIZED, "Authentication required")
    stubProblemResponse(problem, 401)

    const api = createRequestClient({ baseUrl: "http://localhost/" })
    const error = await api.get("api/me").catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(error).toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
      details: problem,
      message: "Authentication required",
      status: 401,
      traceId,
    })
  })

  it("未知 error code 不冒充已知契约并保留原始响应", async () => {
    const details = {
      type: "https://sweet-kit.dev/problems/rate-limited",
      title: "Too Many Requests",
      status: 429,
      detail: "Try again later",
      code: "RATE_LIMITED",
    }
    stubProblemResponse(details, 429)

    const api = createRequestClient({ baseUrl: "http://localhost/" })
    const error = await api.post("api/resource").catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(error).toMatchObject({
      code: undefined,
      details,
      message: "Request failed with status 429",
      status: 429,
      traceId,
    })
  })

  it("problem 的 status 与 HTTP status 不一致时拒绝该契约", async () => {
    const problem = createProblemDetails(ErrorCode.UNAUTHORIZED, "Authentication required")
    stubProblemResponse(problem, 500)

    const api = createRequestClient({ baseUrl: "http://localhost/" })
    const error = await api.get("api/resource").catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(error).toMatchObject({
      code: undefined,
      details: problem,
      message: "Request failed with status 500",
      status: 500,
    })
  })

  it("type 与 code 不一致时拒绝该契约", async () => {
    const problem = {
      ...createProblemDetails(ErrorCode.NOT_FOUND, "资源不存在"),
      code: ErrorCode.CONFLICT,
    }
    stubProblemResponse(problem, 404)

    const api = createRequestClient({ baseUrl: "http://localhost/" })
    const error = await api.get("api/resource").catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(error).toMatchObject({
      code: undefined,
      message: "Request failed with status 404",
      status: 404,
    })
  })

  it("跨服务实例的 type 前缀不同则不视为本契约", async () => {
    const problem = {
      ...createProblemDetails(ErrorCode.FORBIDDEN, "Forbidden"),
      type: getProblemType(ErrorCode.FORBIDDEN).replace("sweet-kit.dev", "other.example"),
    }
    stubProblemResponse(problem, 403)

    const api = createRequestClient({ baseUrl: "http://localhost/" })
    const error = await api.get("api/resource").catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(error).toMatchObject({ code: undefined, status: 403 })
  })
})
