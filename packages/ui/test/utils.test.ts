import { describe, expect, it } from "vitest"

import { cn } from "../src/lib/utils.ts"

/**
 * `cn` 的合并语义是组件的隐式契约：`packages/ui` 每个组件都写成
 * `cn(variants({ variant, size, className }))`，由调用方 className 覆盖变体。
 * 合并引擎从 clsx + tailwind-merge 换成 cn 包后，出错是静默的视觉回归，
 * 所以把契约钉在这里。
 */
describe("cn", () => {
  it("同一属性以后者为准", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("p-4", "p-2")).toBe("p-2")
    expect(cn("rounded-md", "rounded-full")).toBe("rounded-full")
    expect(cn("flex items-center", "items-start")).toBe("flex items-start")
  })

  it("不同变体各自保留", () => {
    expect(cn("hover:p-2", "p-4")).toBe("hover:p-2 p-4")
  })

  it("任意值与阶梯值互相覆盖", () => {
    // 下面的任意值是合并语义的输入，不是样式值，故对本条设计规则例外。
    // eslint-disable-next-line shadcn/no-arbitrary-values
    expect(cn("p-[13px]", "p-3")).toBe("p-3")
    // eslint-disable-next-line shadcn/no-arbitrary-values
    expect(cn("p-3", "p-[13px]")).toBe("p-[13px]")
  })

  it("保留 clsx 的条件合并语义", () => {
    expect(cn("px-2", false, undefined, null)).toBe("px-2")
    expect(cn("px-2", { "text-white": true, hidden: false })).toBe("px-2 text-white")
    expect(cn(["px-2", ["py-1"]])).toBe("px-2 py-1")
  })

  it("调用方 className 能覆盖组件变体", () => {
    expect(cn("h-9 px-4 py-2", "px-6")).toBe("h-9 py-2 px-6")
  })

  it("未传 className 时不注入字面量 undefined", () => {
    expect(cn("px-2", undefined)).toBe("px-2")
  })
})
