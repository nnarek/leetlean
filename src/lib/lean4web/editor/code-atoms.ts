// LEETLEAN: Code persistence via localStorage (like LeetCode), not URL hash.
import { atom } from 'jotai'

const STORAGE_KEY = 'leetlean:editor-code'

function loadCode(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveCode(code: string) {
  try {
    if (code.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, code)
    }
  } catch {
    // storage full or unavailable
  }
}

const codeBaseAtom = atom<string>(loadCode())

/** Atom which represents the editor content and persists it to localStorage. */
export const codeAtom = atom(
  (get) => get(codeBaseAtom),
  (_get, set, code: string) => {
    set(codeBaseAtom, code)
    saveCode(code)
  },
)
