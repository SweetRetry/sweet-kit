import { createOpenAI } from "@ai-sdk/openai"
import { generateText, type LanguageModel } from "ai"

export interface AiProviderOptions {
  apiKey: string
  modelId: string
}

/**
 * AI provider 的装配入口。
 *
 * 凭据与模型名由应用环境变量提供（见 `src/env.ts`），这里只把 provider 客户端
 * 收敛成 `generateText` 可用的 model；装配位置在 composition root（`src/index.ts`），
 * 见 [ADR 0007](../../../docs/adr/0007-runtime-assembly-and-app-ownership.md)。
 */
export function createAiModel(options: AiProviderOptions): LanguageModel {
  return createOpenAI({ apiKey: options.apiKey })(options.modelId)
}

/**
 * 生成一次回复。
 *
 * `telemetry` 打开后 provider 调用会产出 span，本地开发时进入 trace projection，
 * 由 `data/traces.jsonl` 查看，见 [docs/observability.md](../../../docs/observability.md)。
 */
export async function generateAssistantReply(
  model: LanguageModel,
  prompt: string
): Promise<string> {
  const { text } = await generateText({
    model,
    prompt,
    telemetry: {
      functionId: "assistant.reply",
      isEnabled: true,
    },
  })

  return text
}
