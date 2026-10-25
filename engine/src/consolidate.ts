import { kmeans } from 'ml-kmeans'
import type { Env } from './env.ts'
import { MODELS } from './env.ts'

// CONSOLIDATE (PRD FR-E9..E12): clustering proposes candidate signals;
// an analyst names and confirms them. The cluster never creates claims
// and never severs claim→story lineage.

export interface Cluster {
  claimIds: string[]
  centroidSize: number
}

/** Embed every verified, unsignalled claim of a place. */
export async function embedClaims(
  env: Env,
  placeId: string,
): Promise<{ id: string; vec: number[] }[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, text FROM claims
     WHERE place_id = ? AND status = 'verified' AND signal_id IS NULL`,
  )
    .bind(placeId)
    .all<{ id: string; text: string }>()
  const claims = results ?? []
  if (!claims.length) return []
  const res = (await env.AI.run(MODELS.embed, {
    text: claims.map((c) => c.text),
  })) as { data?: number[][] }
  const data = res.data ?? []
  return claims.map((c, i) => ({ id: c.id, vec: data[i] ?? [] })).filter((c) => c.vec.length)
}

/** Cluster claims into candidate signals (k ≈ sqrt(n/2), bounded 2..12). */
export function clusterClaims(embedded: { id: string; vec: number[] }[]): Cluster[] {
  if (embedded.length < 4) return []
  const k = Math.max(2, Math.min(12, Math.round(Math.sqrt(embedded.length / 2))))
  const km = kmeans(embedded.map((e) => e.vec), k, { seed: 42 })
  const buckets = new Map<number, string[]>()
  embedded.forEach((e, i) => {
    const c = km.clusters[i]
    buckets.set(c, [...(buckets.get(c) ?? []), e.id])
  })
  return [...buckets.values()]
    .filter((ids) => ids.length >= 2)
    .map((claimIds) => ({ claimIds, centroidSize: claimIds.length }))
    .sort((a, b) => b.centroidSize - a.centroidSize)
}

/** Full consolidate pass: returns proposed clusters for analyst review. */
export async function runConsolidation(env: Env, placeId: string): Promise<Cluster[]> {
  return clusterClaims(await embedClaims(env, placeId))
}
