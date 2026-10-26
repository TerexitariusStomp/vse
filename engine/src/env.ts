export interface Env {
  DB: D1Database
  ARTIFACTS: R2Bucket
  PIPELINE: Queue<PipelineJob>
  DLQ?: Queue<PipelineJob>
  AI: Ai
  WHATSAPP_VERIFY_TOKEN?: string
  WHATSAPP_TOKEN?: string
  // WhatsApp app secret — when set, POST /intake/whatsapp is HMAC-verified
  // against X-Hub-Signature-256. Set it in production or the webhook is an
  // open story-injection lane.
  WHATSAPP_APP_SECRET?: string
  // Cloudflare Turnstile — when set, public web intake + check-session mints
  // must carry a verified `turnstile_token`. Unset = facilitated mode.
  TURNSTILE_SECRET?: string
  // Resend — when set, POST /api/check/link emails the participant link;
  // otherwise the link returns for facilitator hand-off.
  RESEND_API_KEY?: string
  ANALYST_KEY?: string
}

/** Queue message types between pipeline stages. */
export type PipelineJob =
  | { kind: 'transcribe'; placeId: string; r2Key: string; tellerRole: string; channel: string }
  | { kind: 'extract'; placeId: string; storyId: string }
  | { kind: 'consolidate'; placeId: string }

// Model ids — all commercially-usable weights (OSS-STACK.md).
export const MODELS = {
  // Whisper (MIT) — voice intake transcription.
  whisper: '@cf/openai/whisper',
  // Llama 3.3 70B Instruct fp8-fast (Llama Community License) — claim extraction.
  llm: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  // BGE-base (MIT) — claim embeddings for consolidation clustering.
  embed: '@cf/baai/bge-base-en-v1.5',
} as const
