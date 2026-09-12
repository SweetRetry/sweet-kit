import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createProblemDetails,
  ErrorCode,
  getErrorCodeFromProblemType,
  getProblemTitle,
  getProblemType,
  isProblemDetails,
  PROBLEM_MEDIA_TYPE,
  PROBLEM_TYPE_PREFIX,
} from "../src/contract.ts"

const allErrorCodes = Object.values(ErrorCode)

afterEach(() => {
  vi.restoreAllMocks()
})

describe("problem details contract", () => {
  it("每个 error code 都有 status、title 与唯一的 type", () => {
    const types = allErrorCodes.map((code) => getProblemType(code))

    expect(new Set(types).size).toBe(allErrorCodes.length)

    for (const code of allErrorCodes) {
      expect(getProblemTitle(code).length).toBeGreaterThan(0)
      expect(getErrorCodeFromProblemType(getProblemType(code))).toBe(code)
    }
  })

  it("由 code 唯一决定标准成员，调用方只提供 detail", () => {
    const problem = createProblemDetails(ErrorCode.VALIDATION_ERROR, "email 字段格式不正确")

    expect(problem).toEqual({
      type: getProblemType(ErrorCode.VALIDATION_ERROR),
      title: "Validation Error",
      status: 400,
      detail: "email 字段格式不正确",
      code: ErrorCode.VALIDATION_ERROR,
    })
    expect(isProblemDetails(problem)).toBe(true)
  })

  it("traceId 只随 INTERNAL_SERVER_ERROR 出现", () => {
    const traceId = "11111111111111111111111111111111"

    expect(
      createProblemDetails(ErrorCode.INTERNAL_SERVER_ERROR, "Internal Server Error", { traceId })
    ).toMatchObject({ traceId })

    expect(
      createProblemDetails(ErrorCode.UNAUTHORIZED, "Authentication required", { traceId })
    ).not.toHaveProperty("traceId")
  })

  it("拒绝 type 与 code 不一致或 status 与 code 不一致的响应体", () => {
    const problem = createProblemDetails(ErrorCode.NOT_FOUND, "资源不存在")

    expect(isProblemDetails(problem)).toBe(true)
    expect(isProblemDetails({ ...problem, type: getProblemType(ErrorCode.CONFLICT) })).toBe(false)
    expect(isProblemDetails({ ...problem, type: "https://example.com/problems/not-found" })).toBe(
      false
    )
    expect(isProblemDetails({ ...problem, status: 500 })).toBe(false)
    expect(isProblemDetails({ ...problem, code: "RATE_LIMITED" })).toBe(false)
    expect(isProblemDetails({ ...problem, title: "" })).toBe(false)
    expect(isProblemDetails({ ...problem, detail: undefined })).toBe(false)
    expect(isProblemDetails({ ...problem, traceId: "not-a-trace-id" })).toBe(false)
  })

  it("允许 RFC 9457 的扩展成员", () => {
    const problem = {
      ...createProblemDetails(ErrorCode.VALIDATION_ERROR, "invalid"),
      errors: [{ path: "email", message: "invalid" }],
    }

    expect(isProblemDetails(problem)).toBe(true)
  })

  it("每个 type 都是绝对的 https URI，便于文档链接解析", () => {
    for (const code of allErrorCodes) {
      const type = getProblemType(code)

      expect(type.startsWith(PROBLEM_TYPE_PREFIX)).toBe(true)
      expect(new URL(type).protocol).toBe("https:")
    }
  })

  it("媒体类型是 RFC 9457 注册的类型", () => {
    expect(PROBLEM_MEDIA_TYPE).toBe("application/problem+json")
  })
})
