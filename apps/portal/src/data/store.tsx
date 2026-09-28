import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createActions } from './actions'
import { createSeed } from './seed'
import { StoreContext } from './store-context'
import type { DemoState } from './types'

/**
 * In-memory demo store. Actions run synchronously against the latest state (so several actions in one
 * event see each other's results and can return validation errors), then notify React.
 * Reloading the page restores the seed.
 */
function createDemoStore() {
  let state: DemoState = createSeed()
  const listeners = new Set<() => void>()
  const actions = createActions(
    () => state,
    (next) => {
      state = next
      listeners.forEach((listener) => listener())
    },
  )
  return {
    actions,
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createDemoStore)
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  const value = useMemo(() => ({ state, actions: store.actions }), [state, store])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
