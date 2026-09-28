import { createContext, useContext } from 'react'
import type { StoreActions } from './actions'
import type { DemoState } from './types'

export interface StoreValue {
  state: DemoState
  actions: StoreActions
}

export const StoreContext = createContext<StoreValue | null>(null)

/** Read demo state and call typed actions. Actions are stable across renders. */
export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside <StoreProvider>')
  return value
}
