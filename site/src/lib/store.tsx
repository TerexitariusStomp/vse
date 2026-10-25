import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Gate, Results } from './results'

export type Vote = 'endorse' | 'amend' | 'contest'

interface VisitorState {
  votes: Record<string, Vote>
  gateOverrides: Record<string, Gate>
  vote: (signalId: string, v: Vote) => void
  setGate: (signalId: string, g: Gate) => void
  effectiveGate: (signalId: string, fileGate: Gate) => Gate
}

const VisitorCtx = createContext<VisitorState | null>(null)

/** Memory-only visitor interactions — nothing persisted (FR-D9). */
export function VisitorProvider({ children }: { children: ReactNode }) {
  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const [gateOverrides, setGateOverrides] = useState<Record<string, Gate>>({})
  const value = useMemo<VisitorState>(
    () => ({
      votes,
      gateOverrides,
      vote: (signalId, v) => setVotes((s) => ({ ...s, [signalId]: v })),
      setGate: (signalId, g) => setGateOverrides((s) => ({ ...s, [signalId]: g })),
      effectiveGate: (signalId, fileGate) => gateOverrides[signalId] ?? fileGate,
    }),
    [votes, gateOverrides],
  )
  return <VisitorCtx.Provider value={value}>{children}</VisitorCtx.Provider>
}

export function useVisitor() {
  const ctx = useContext(VisitorCtx)
  if (!ctx) throw new Error('useVisitor outside provider')
  return ctx
}

const ResultsCtx = createContext<Results | null>(null)

export function ResultsProvider({
  results,
  children,
}: {
  results: Results
  children: ReactNode
}) {
  return <ResultsCtx.Provider value={results}>{children}</ResultsCtx.Provider>
}

export function useResults() {
  const ctx = useContext(ResultsCtx)
  if (!ctx) throw new Error('useResults outside provider')
  return ctx
}
