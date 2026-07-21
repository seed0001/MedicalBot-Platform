import { config, openRouterConfigured } from '../config.js'

/**
 * Thin OpenRouter client. Deliberately not the OpenAI SDK — we need the
 * `models` fallback array and OpenRouter's ranking headers, and the surface we
 * use is small enough that a fetch wrapper is less code than adapting a SDK.
 */

export type TaskClass = 'chat' | 'extract' | 'analyze' | 'vision'

const MODEL_BY_TASK: Record<TaskClass, () => string> = {
  chat: () => config.MODEL_CHAT,
  extract: () => config.MODEL_EXTRACT,
  analyze: () => config.MODEL_ANALYZE,
  vision: () => config.MODEL_VISION,
}

/**
 * Multimodal content parts. A message's content is either plain text or an array
 * of parts — text plus an image (data URL) or a PDF `file` part, which is how the
 * document parser hands scans and reports to a vision-capable model.
 */
export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } }

export interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | ContentPart[]
  /** Present on assistant turns that requested tools; echoed back next round. */
  tool_calls?: ToolCall[]
  /** Present on tool-result turns, linking back to the call. */
  tool_call_id?: string
  name?: string
}

export interface CompletionOptions {
  task: TaskClass
  messages: ChatMessage[]
  tools?: unknown[]
  /** Ordered fallbacks. OpenRouter tries the next on provider failure. */
  fallbackModels?: string[]
  temperature?: number
  maxTokens?: number
  /** Forces the model to emit JSON matching this schema. Used by extraction. */
  jsonSchema?: { name: string; schema: Record<string, unknown> }
  signal?: AbortSignal
}

export interface CompletionResult {
  content: string
  model: string
  toolCalls: ToolCall[]
  usage: { promptTokens: number; completionTokens: number } | null
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

export async function complete(options: CompletionOptions): Promise<CompletionResult> {
  if (!openRouterConfigured) {
    throw new OpenRouterError('OPENROUTER_API_KEY is not set', 500, '')
  }

  const model = MODEL_BY_TASK[options.task]()

  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? (options.task === 'chat' ? 0.7 : 0),
    max_tokens: options.maxTokens ?? 2048,
  }

  if (options.fallbackModels?.length) body.models = [model, ...options.fallbackModels]
  if (options.tools?.length) body.tools = options.tools
  if (options.jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { ...options.jsonSchema, strict: true },
    }
  }

  const response = await fetch(`${config.OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.APP_URL,
      'X-Title': 'MedicalBot Platform',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new OpenRouterError(
      `OpenRouter returned ${response.status}`,
      response.status,
      text.slice(0, 500),
    )
  }

  const json = (await response.json()) as {
    model?: string
    choices?: Array<{ message?: { content?: string; tool_calls?: ToolCall[] } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }

  const choice = json.choices?.[0]
  return {
    content: choice?.message?.content ?? '',
    model: json.model ?? model,
    toolCalls: choice?.message?.tool_calls ?? [],
    usage: json.usage
      ? {
          promptTokens: json.usage.prompt_tokens ?? 0,
          completionTokens: json.usage.completion_tokens ?? 0,
        }
      : null,
  }
}
