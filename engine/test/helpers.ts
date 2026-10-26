// Test harness: a D1-shaped stub over node:sqlite so route tests exercise
// real SQL — including the commons_sticky trigger. R2/Queue/AI are
// in-memory fakes; nothing touches the network.
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Env } from '../src/env.ts'

const MIGRATIONS = new URL('../migrations/', import.meta.url).pathname

class Statement {
  params: unknown[] = []
  db: DatabaseSync
  sql: string
  constructor(db: DatabaseSync, sql: string) {
    this.db = db
    this.sql = sql
  }
  bind(...params: unknown[]) {
    const s = new Statement(this.db, this.sql)
    s.params = params
    return s
  }
  private exec() {
    return this.db.prepare(this.sql)
  }
  // D1 throws on constraint violations — mirror that (methods stay async
  // like the real API, so .catch() and await behave identically).
  async run() {
    const r = this.exec().run(...(this.params as never[]))
    return { success: true as const, meta: { changes: r.changes, last_row_id: r.lastInsertRowid } }
  }
  async first<T = Record<string, unknown>>() {
    return (this.exec().get(...(this.params as never[])) ?? null) as T | null
  }
  async all<T = Record<string, unknown>>() {
    return { results: this.exec().all(...(this.params as never[])) as T[] }
  }
}

class D1Stub {
  db: DatabaseSync
  constructor(db: DatabaseSync) {
    this.db = db
  }
  prepare(sql: string) {
    return new Statement(this.db, sql)
  }
  async batch(stmts: Statement[]) {
    const out = []
    for (const s of stmts) out.push(await s.run()) // throw on first failure, like D1
    return out
  }
}

class R2Stub {
  store = new Map<string, string>()
  async put(key: string, body: unknown) {
    this.store.set(key, typeof body === 'string' ? body : String(body))
  }
  async get(key: string) {
    const v = this.store.get(key)
    if (v === undefined) return null
    return {
      json: async () => JSON.parse(v),
      text: async () => v,
      arrayBuffer: async () => new TextEncoder().encode(v).buffer,
    }
  }
}

export function makeEnv(overrides: Record<string, unknown> = {}) {
  const sqlite = new DatabaseSync(':memory:')
  for (const f of readdirSync(MIGRATIONS).sort())
    sqlite.exec(readFileSync(join(MIGRATIONS, f), 'utf8'))
  const queue: unknown[] = []
  const env = {
    DB: new D1Stub(sqlite),
    ARTIFACTS: new R2Stub(),
    PIPELINE: { send: async (job: unknown) => void queue.push(job) },
    AI: { run: async () => ({ response: '{"claims":[]}' }) },
    ANALYST_KEY: 'test-key',
    ...overrides,
  } as unknown as Env
  return { env, sqlite, queue }
}

export function req(path: string, init: RequestInit = {}) {
  return new Request(`http://test${path}`, init)
}

export const jsonPost = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  req(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

export const ANALYST = { authorization: 'Bearer test-key' }
