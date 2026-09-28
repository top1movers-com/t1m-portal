import { useEffect, useState } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'

const STORAGE_KEY = 't1m-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readPref(): ThemePref {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    return 'light'
  }
  return 'light'
}

function applyPref(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia(DARK_QUERY).matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

/** Light / Dark / System, persisted like the style guide (index.html applies it before first paint). */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref)

  useEffect(() => {
    applyPref(pref)
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      // Storage can be blocked (private mode); the choice still applies for this visit.
    }
    if (pref !== 'system') return
    const query = window.matchMedia(DARK_QUERY)
    const onChange = () => applyPref('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [pref])

  return [pref, setPref] as const
}
