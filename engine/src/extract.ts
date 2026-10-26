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
- Each "text" must be copied EXACTLY from the story, character for character,
  including capitalisation and punctuation.
- "span" is the [start, end) character offsets of that text in the story.
- Never paraphrase, summarise, complete, or infer. If the story does not say
  it in its own words, it is not a claim. Do not imagine context around the
  story; only what is written counts.
- If the whole story is itself a statement of a need, value or want, return
  the whole story as a single claim.
- 0–6 claims. A short story may contain only one claim, or none. Do not pad.

Example story: "The bus stop has no shelter and the route was cut last year."
Example output: {"claims":[{"text":"The bus stop has no shelter","span":[0,27]},{"text":"the route was cut last year","span":[32,59]}]}

Example story: "Marsh regeneration scheme"
Example output: {"claims":[{"text":"Marsh regeneration scheme","span":[0,25]}]}

Return ONLY JSON of the form {"claims":[{"text":...,"span":[a,b]}]}.

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

/** Models return differently-shaped responses; find the generated text. */
function responseText(res: unknown): string {
  const r = res as any
  if (typeof r?.response === 'string') return r.response
  if (typeof r?.response?.text === 'string') return r.response.text
  if (typeof r?.choices?.[0]?.text === 'string') return r.choices[0].text
  if (typeof r?.choices?.[0]?.message?.content === 'string')
    return r.choices[0].message.content
  if (typeof r?.result === 'string') return r.result
  return ''
}

export async function extractClaims(ai: Ai, storyText: string): Promise<CandidateClaim[]> {
  const res = (await ai.run(MODELS.llm, {
    prompt: PROMPT.replace('%s', storyText),
    max_tokens: 2048,
  })) as { response?: string }
  const raw = responseText(res)
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
  let fallback = false
  // Micro-story fallback: below ~120 chars the whole text is the only
  // plausible span, so when the model proposes nothing we propose the
  // story itself. Same mechanical contract — the claim must slice-equal
  // the story text, which it does trivially.
  if (!candidates.length && story.text.trim().length && story.text.length <= 120) {
    candidates.push({ text: story.text, span: [0, story.text.length] })
    fallback = true
  }
  const stmt = env.DB.prepare(
    `INSERT INTO claims (id, place_id, story_id, text, span_start, span_end, status, proposer)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const dupe = env.DB.prepare(
    'SELECT 1 FROM claims WHERE story_id = ? AND text = ? AND status = ?',
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
    // Re-drives and batch retries would otherwise append duplicate rows.
    if (await dupe.bind(story.id, c.text, status).first()) continue
    await stmt
      .bind(
        crypto.randomUUID(), story.place_id, story.id, c.text,
        span[0], span[1], status, fallback ? 'fallback' : 'model',
      )
      .run()
  }
}
