// node --experimental-strip-types --test test/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findSpans, spanValid } from '../src/extract.ts'
import { clusterClaims } from '../src/consolidate.ts'
import { checkSemantics } from '../../tools/results-lib.mjs'

const story = 'The hall is cold in winter. We need transport on market days.'

test('findSpans locates verbatim text', () => {
  assert.deepEqual(findSpans(story, 'cold in winter'), [[12, 26]])
  assert.deepEqual(findSpans(story, 'not present'), [])
})

test('spanValid enforces slice equality (gate G9)', () => {
  assert.ok(spanValid(story, { text: 'cold in winter', span: [12, 26] }))
  assert.ok(!spanValid(story, { text: 'paraphrased words', span: [12, 26] }))
  assert.ok(!spanValid(story, { text: 'cold in winter', span: [0, 5] }))
})

test('clusterClaims groups similar embeddings', () => {
  const mk = (x: number) => ({ id: crypto.randomUUID(), vec: [x, 0, 0] })
  const emb = [mk(0), mk(0.1), mk(0.2), mk(9), mk(9.1), mk(9.2), mk(0.15), mk(8.9)]
  const clusters = clusterClaims(emb)
  assert.ok(clusters.length >= 2)
  assert.equal(clusters.flatMap((c) => c.claimIds).length, emb.length)
})

test('checkSemantics catches severed lineage', () => {
  const bad = {
    stories: [{ id: 's1', teller_role: 'r', channel: 'web', text: 'hello world' }],
    claims: [{ id: 'c1', story_id: 's1', text: 'hello', span: [0, 4], signal_id: 'sig1' }],
    signals: [{
      id: 'sig1', statement: 'x', supporting_claim_ids: ['c1'],
      voices: 1, recurrence: 1,
      verification: { participants: 1, endorse: 1, amend: 0, contest: 0, amendments: [], gate: 'not_yet' },
    }],
    interventions: { from_plans: [], from_place: [] },
    sips: [],
  }
  const errors = checkSemantics(bad)
  assert.ok(errors.some((e) => e.includes('slice-equal')))
})
