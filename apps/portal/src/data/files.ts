import { nowISO } from './clock'
import type { FileRef } from './types'
import { CURRENT_USER } from './users'

let counter = 0

export function newId(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`
}

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

function plausibleSize(name: string): number {
  const isImage = /\.(jpe?g|png|heic|webp)$/i.test(name)
  const [min, spread] = isImage ? [900_000, 2_400_000] : [60_000, 1_100_000]
  return min + (hash(name) % spread)
}

export interface MockFileOptions {
  size?: number
  by?: string
  at?: string
}

/** Builds file metadata for a simulated upload. Nothing is stored. */
export function makeMockFile(name: string, options: MockFileOptions = {}): FileRef {
  return {
    id: newId('file'),
    name,
    size: options.size ?? plausibleSize(name),
    uploadedAt: options.at ?? nowISO(),
    uploadedBy: options.by ?? CURRENT_USER.id,
  }
}
