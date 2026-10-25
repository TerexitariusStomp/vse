import { z } from 'zod'
import type { Env } from './env.ts'
import { MODELS } from './env.ts'

// EXTRACT (PRD FR-E4..E8): the model proposes, the span check disposes.
// A claim that does not slice-equal the story text is quarantined, never
// published — verbatim lineage is load-bearing (gate G9).

const ProposedClaim = z.object({
  text: z.string().min(1),
  span: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
})
export type CandidateClaim = z.infer<typeof ProposedClaim>

export const ExtractionResponse = z.object({ claims: z.array(ProposedClaim) })

const PROMPT = `You are an extraction assistant for a community-listening system.
From the story below, extract the passages where the teller expresses a need,
a value, a change they want, or a harm they fear.

Rules — violate any and the output is discarded:
- Each "text" must be copied EXACTLY from the story, character for character.
- "span" is the [start, end) character offsets of that text in the story.
- Never paraphrase, summarise, or invent.
- 3–10 claims. Return ONLY JSON of the form {"claims":[{"text":...,"span":[a,b]}]}.

Story:
"""
%s
"""`

/** Locate `text` in `story`; returns candidate spans (empty if absent). */
export function findSpans(story: string, text: string): [number, number][] {
  const out: [number, number][] = []
  let i = story.indexOf(text)
  while (i !== -1) {
    out.push([i, i + text.length])
    i = story.indexOf(text, i + 1)
  }
  return out
}

/** A claim is verifiable iff its stored span slice-equals its text. */
export function spanValid(storyText: string, c: CandidateClaim): boolean {
  const [a, b] = c.span
  return a >= 0 && b <= storyText.length && a < b && storyText.slice(a, b) === c.text
}

export async function extractClaims(ai: Ai, storyText: string): Promise<CandidateClaim[]> {
  const res = (await ai.run(MODELS.llm, {
    prompt: PROMPT.replace('%s', storyText),
    max_tokens: 2048,
  })) as { response?: string }
  const raw = res.response ?? ''
  const jsonStart = raw.indexOf('{')
  if (jsonStart === -1) return []
  try {
    return ExtractionResponse.parse(JSON.parse(raw.slice(jsonStart))).claims
  } catch {
    // Model output not parseable as the contract — treat as zero proposals;
    // an analyst can extract manually via POST /api/claims.
    return []
  }
}

/**
 * Run extraction for one story and persist the results.
 * Every proposed claim is checked mechanically; failures go to quarantine
 * with status='quarantined' so the analyst console can review them.
 */
export async function runExtraction(env: Env, storyId: string): Promise<void> {
  const story = await env.DB.prepare(
    'SELECT id, place_id, text FROM stories WHERE id = ? AND withdrawn = 0',
  )
    .bind(storyId)
    .first<{ id: string; place_id: string; text: string }>()
  if (!story) return

  const candidates = await extractClaims(env.AI, story.text)
  const stmt = env.DB.prepare(
    `INSERT INTO claims (id, place_id, story_id, text, span_start, span_end, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const c of candidates) {
    // If the model's span is wrong but the text is verbatim, heal the span
    // to the first exact occurrence — lineage to real words is preserved;
    // paraphrases (no exact occurrence at all) are quarantined.
    let span = c.span
    let status = 'verified'
    if (!spanValid(story.text, c)) {
      const found = findSpans(story.text, c.text)
      if (found.length) span = found[0]
      else status = 'quarantined'
    }
    await stmt
      .bind(crypto.randomUUID(), story.place_id, story.id, c.text, span[0], span[1], status)
      .run()
  }
}
