import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

// Single-page navigation state: which story/signal is expanded, and which
// claim to spotlight after a trace. Nonces force re-scroll on repeat clicks.

interface UIState {
  openStory: string | null
  openSignal: string | null
  focusClaim: string | null
  claimNonce: number
  signalNonce: number
  toggleStory: (id: string) => void
  toggleSignal: (id: string) => void
  goToClaim: (storyId: string, claimId: string) => void
  goToSignal: (signalId: string) => void
}

const UICtx = createContext<UIState | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [openStory, setOpenStory] = useState<string | null>(null)
  const [openSignal, setOpenSignal] = useState<string | null>(null)
  const [focusClaim, setFocusClaim] = useState<string | null>(null)
  const [claimNonce, setClaimNonce] = useState(0)
  const [signalNonce, setSignalNonce] = useState(0)

  const value = useMemo<UIState>(
    () => ({
      openStory,
      openSignal,
      focusClaim,
      claimNonce,
      signalNonce,
      toggleStory: (id) => setOpenStory((s) => (s === id ? null : id)),
      toggleSignal: (id) => setOpenSignal((s) => (s === id ? null : id)),
      goToClaim: (storyId, claimId) => {
        setOpenStory(storyId)
        setFocusClaim(claimId)
        setClaimNonce((n) => n + 1)
      },
      goToSignal: (signalId) => {
        setOpenSignal(signalId)
        setSignalNonce((n) => n + 1)
      },
    }),
    [openStory, openSignal, focusClaim, claimNonce, signalNonce],
  )
  return <UICtx.Provider value={value}>{children}</UICtx.Provider>
}

export function useUI() {
  const ctx = useContext(UICtx)
  if (!ctx) throw new Error('useUI outside provider')
  return ctx
}
