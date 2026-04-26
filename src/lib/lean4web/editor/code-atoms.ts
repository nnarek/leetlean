// LEETLEAN: Simplified - removed URL import support (import-atoms dependency removed)
import { atom } from 'jotai'
import LZString from 'lz-string'

import { settingsAtom } from '../settings/settings-atoms'
import { urlArgsAtom, urlArgsStableAtom } from '../store/url-atoms'
import { fixedEncodeURIComponent } from '../utils/UrlParsing'

/** Atom which represents the editor content and synchronises it with the url hash. */
export const codeAtom = atom(
  (get) => {
    const urlArgs = get(urlArgsStableAtom)
    if (urlArgs.code) {
      return urlArgs.code
    }
    if (urlArgs.codez) {
      return LZString.decompressFromBase64(urlArgs.codez)
    }
    return ''
  },
  (get, set, code: string) => {
    const urlArgs = get(urlArgsAtom)
    if (code.length === 0) {
      set(urlArgsAtom, { ...urlArgs, code: undefined, codez: undefined })
      return
    }
    if (get(settingsAtom).compress) {
      const compressedCode = LZString.compressToBase64(code).replace(/=*$/, '')
      set(urlArgsAtom, {
        ...urlArgs,
        code: undefined,
        codez: fixedEncodeURIComponent(compressedCode),
      })
    } else {
      const encodedCode = fixedEncodeURIComponent(code)
      set(urlArgsAtom, { ...urlArgs, code: encodedCode, codez: undefined })
    }
  },
)
