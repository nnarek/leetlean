import { atom } from 'jotai'

/**
 * Atom to store the screen width. Note that this atom needs to be updated with a `useEffect`
 * in the editor component.
 */
// LEETLEAN: SSR guard for Next.js
export const screenWidthAtom = atom(typeof window !== 'undefined' ? window.innerWidth : 1024)
