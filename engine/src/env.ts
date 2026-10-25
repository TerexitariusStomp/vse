export interface Env {
  DB: D1Database
  ARTIFACTS: R2Bucket
  PIPELINE: Queue<PipelineJob>
  AI: Ai
  WHATSAPP_VERIFY_TOKEN?: string
  WHATSAPP_TOKEN?: string
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
  // Mistral-7B Instruct (Apache-2.0) — candidate claim extraction.
  llm: '@cf/mistral/mistral-7b-instruct-v0.1',
  // BGE-base (MIT) — claim embeddings for consolidation clustering.
  embed: '@cf/baai/bge-base-en-v1.5',
} as const
