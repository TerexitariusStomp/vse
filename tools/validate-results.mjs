#!/usr/bin/env node
// Validate a VSE results file: JSON Schema 2020-12 + semantic invariants.
// Usage: node tools/validate-results.mjs <results.json> [--schema path]
// Exit 0 = valid; exit 1 = errors; exit 2 = usage/io error.
// The engine's PUBLISH step (FR-E24) calls the same two layers.

import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { avgSignalsPerIntervention, checkSemantics, unreachedSignals } from './results-lib.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const file = process.argv[2]
const schemaPath =
  process.argv.includes('--schema')
    ? process.argv[process.argv.indexOf('--schema') + 1]
    : resolve(root, 'schema/results.schema.json')

if (!file) {
  console.error('usage: validate-results <results.json> [--schema path]')
  process.exit(2)
}

let data, schema
try {
  data = JSON.parse(await readFile(file, 'utf8'))
  schema = JSON.parse(await readFile(schemaPath, 'utf8'))
} catch (e) {
  console.error(`error: ${e.message}`)
  process.exit(2)
}

// layer 1 — structure (JSON Schema 2020-12)
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)
const schemaErrors = validate(data) ? [] : (validate.errors ?? [])

// layer 2 — semantics (only meaningful if structure holds)
const semErrors = schemaErrors.length ? [] : checkSemantics(data)

for (const e of schemaErrors)
  console.error(`schema  ${e.instancePath || '/'} ${e.message}`)
for (const e of semErrors) console.error(`semantic ${e}`)

if (schemaErrors.length || semErrors.length) {
  console.error(
    `\n${file}: INVALID — ${schemaErrors.length} schema, ${semErrors.length} semantic errors`,
  )
  process.exit(1)
}

// report what the file says, derived — the demonstrator shows the same numbers
const fp = avgSignalsPerIntervention(data.interventions?.from_plans)
const fq = avgSignalsPerIntervention(data.interventions?.from_place)
console.log(`${file}: valid`)
console.log(`  stories ${data.stories.length} · claims ${data.claims.length} · signals ${data.signals.length}`)
console.log(`  from_plans avg needs/intervention ${fp.toFixed(1)} · unreached ${unreachedSignals(data, 'from_plans').map((s) => s.id).join(', ') || 'none'}`)
console.log(`  from_place avg needs/intervention ${fq.toFixed(1)} · unreached ${unreachedSignals(data, 'from_place').map((s) => s.id).join(', ') || 'none'}`)
