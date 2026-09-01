import { afterEach, describe, expect, it, vi } from "vitest"

import { trackEvent } from "../lib/analytics.ts"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("trackEvent", () => {
  it("forwards one event to every initialized analytics channel", () => {
    const gtag = vi.fn()
    const uetPush = vi.fn()
    const fbq = vi.fn()
    vi.stubGlobal("window", {
      fbq,
      gtag,
      uetq: { push: uetPush },
    })

    const properties = { plan: "pro", value: 99 }
    trackEvent("subscription_started", properties)

    expect(gtag).toHaveBeenCalledWith("event", "subscription_started", properties)
    expect(uetPush).toHaveBeenCalledWith("event", "subscription_started", properties)
    expect(fbq).toHaveBeenCalledWith("trackCustom", "subscription_started", properties)
  })

  it("does not fail during server rendering", () => {
    expect(() => trackEvent("subscription_started")).not.toThrow()
  })
})
