export type AnalyticsEventProperties = Record<string, boolean | number | string>

type AnalyticsFunction = (...args: unknown[]) => void

interface AnalyticsState {
  googleAnalyticsIds: Set<string>
  metaPixelIds: Set<string>
  metaPixelPaths: Map<string, string>
  microsoftUetTagIds: Set<string>
}

interface MetaPixel extends AnalyticsFunction {
  callMethod?: AnalyticsFunction
  loaded: boolean
  push: MetaPixel
  queue: unknown[][]
  version: string
}

interface UetQueue {
  push(...args: unknown[]): unknown
}

interface UetConstructor {
  new (options: { enableAutoSpaTracking: boolean; q: UetQueue; ti: string }): UetQueue
}

interface AnalyticsWindow extends Window {
  UET?: UetConstructor
  __sweetKitAnalytics?: AnalyticsState
  _fbq?: MetaPixel
  dataLayer?: unknown[][]
  fbq?: MetaPixel
  gtag?: AnalyticsFunction
  uetq?: UetQueue
}

function getAnalyticsWindow() {
  return window as AnalyticsWindow
}

function getAnalyticsState() {
  const analyticsWindow = getAnalyticsWindow()
  analyticsWindow.__sweetKitAnalytics ??= {
    googleAnalyticsIds: new Set(),
    metaPixelIds: new Set(),
    metaPixelPaths: new Map(),
    microsoftUetTagIds: new Set(),
  }
  return analyticsWindow.__sweetKitAnalytics
}

export function initializeGoogleAnalytics(measurementId: string) {
  const state = getAnalyticsState()
  if (state.googleAnalyticsIds.has(measurementId)) {
    return
  }

  const analyticsWindow = getAnalyticsWindow()
  analyticsWindow.dataLayer ??= []
  analyticsWindow.gtag ??= (...args: unknown[]) => {
    analyticsWindow.dataLayer?.push(args)
  }
  analyticsWindow.gtag("js", new Date())
  analyticsWindow.gtag("config", measurementId)
  state.googleAnalyticsIds.add(measurementId)
}

export function initializeMetaPixel(pixelId: string) {
  const state = getAnalyticsState()
  if (state.metaPixelIds.has(pixelId)) {
    return
  }

  const analyticsWindow = getAnalyticsWindow()

  if (!analyticsWindow.fbq) {
    const pixel: MetaPixel = (...args: unknown[]) => {
      if (pixel.callMethod) {
        pixel.callMethod(...args)
        return
      }

      pixel.queue.push(args)
    }
    pixel.push = pixel
    pixel.loaded = true
    pixel.version = "2.0"
    pixel.queue = []
    analyticsWindow.fbq = pixel
    analyticsWindow._fbq = pixel
  }

  analyticsWindow.fbq("init", pixelId)
  state.metaPixelIds.add(pixelId)
}

export function initializeMicrosoftUet(tagId: string) {
  const state = getAnalyticsState()
  if (state.microsoftUetTagIds.has(tagId)) {
    return
  }

  const analyticsWindow = getAnalyticsWindow()
  const Uet = analyticsWindow.UET

  if (!Uet) {
    return
  }

  const queue = analyticsWindow.uetq ?? { push: () => undefined }
  analyticsWindow.uetq = new Uet({
    enableAutoSpaTracking: true,
    q: queue,
    ti: tagId,
  })
  analyticsWindow.uetq.push("pageLoad")
  state.microsoftUetTagIds.add(tagId)
}

export function trackMetaPageView(pixelId: string, pathname: string) {
  const state = getAnalyticsState()
  if (state.metaPixelPaths.get(pixelId) === pathname) {
    return
  }

  getAnalyticsWindow().fbq?.("track", "PageView")
  state.metaPixelPaths.set(pixelId, pathname)
}

export function trackEvent(name: string, properties: AnalyticsEventProperties = {}) {
  if (typeof window === "undefined") {
    return
  }

  const analyticsWindow = getAnalyticsWindow()
  analyticsWindow.gtag?.("event", name, properties)
  analyticsWindow.uetq?.push("event", name, properties)
  analyticsWindow.fbq?.("trackCustom", name, properties)
}
