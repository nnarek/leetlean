// LEETLEAN: Per-problem code persistence via localStorage.
import { atom } from 'jotai'

const STORAGE_PREFIX = 'leetlean:editor-code:'
const OLD_GLOBAL_KEY = 'leetlean:editor-code'

/**
 * Remove the legacy global key (used before per-problem caching was added).
 * This prevents stale global state from interfering with per-problem keys.
 * Called once on first load.
 */
let _migrated = false
function migrateOldGlobalKey() {
  if (_migrated || typeof window === 'undefined') return
  _migrated = true
  try {
    if (localStorage.getItem(OLD_GLOBAL_KEY) !== null) {
      console.debug('[LeetLean] Removing legacy global editor-code key')
      localStorage.removeItem(OLD_GLOBAL_KEY)
    }
  } catch {
    // ignore
  }
}

/** Load saved code for a specific problem from localStorage. */
export function loadCodeForProblem(problemId: string): string {
  if (typeof window === 'undefined') return ''
  migrateOldGlobalKey()
  if (!problemId) {
    console.warn('[LeetLean] loadCodeForProblem called with empty problemId')
    return ''
  }
  try {
    const key = STORAGE_PREFIX + problemId
    const saved = localStorage.getItem(key) ?? ''
    console.debug('[LeetLean] loadCodeForProblem', { problemId, key, hasCode: saved.length > 0 })
    return saved
  } catch {
    return ''
  }
}

/** Save code for a specific problem to localStorage. */
export function saveCodeForProblem(problemId: string, code: string) {
  if (!problemId) {
    console.warn('[LeetLean] saveCodeForProblem called with empty problemId — skipping')
    return
  }
  try {
    const key = STORAGE_PREFIX + problemId
    if (code.length === 0) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, code)
    }
  } catch {
    // storage full or unavailable
  }
}

/** Clear saved code for a specific problem. */
export function clearCodeForProblem(problemId: string) {
  if (!problemId) return
  try {
    localStorage.removeItem(STORAGE_PREFIX + problemId)
  } catch {
    // ignore
  }
}

/** In-memory atom for current editor code (no persistence — persistence is handled per-problem). */
export const codeAtom = atom<string>('')
