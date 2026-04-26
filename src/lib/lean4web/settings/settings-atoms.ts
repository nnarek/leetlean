// LEETLEAN: Simplified settings-atoms - removed URL-based settings persistence
// to avoid conflicts with Next.js routing. Settings stored in localStorage only.
import { atomWithStorage } from 'jotai/utils'
import { atom } from 'jotai/vanilla'

import { screenWidthAtom } from '../store/window-atoms'
import { cleanObject } from '../utils/cleanObject'
import { defaultSettings, PartialUserSettings, Settings } from './settings-types'

/** User settings as they are stored in storage */
const settingsStoreAtom = atomWithStorage<PartialUserSettings>('lean4web:settings', {}, undefined, {
  getOnInit: true,
})

/** The settings which apply for the current session */
const settingsBaseAtom = atom<Settings>({ saved: false, inUrl: false, ...defaultSettings })

/**
 * The user settings combined from different sources, with decreasing priority:
 * - browser storage
 * - current (local) state (base)
 * - default values (base)
 *
 * LEETLEAN: Removed URL param-based settings (settingsUrlAtom) to avoid Next.js routing conflicts.
 */
export const settingsAtom = atom(
  (get) => {
    const base = get(settingsBaseAtom)
    const store = cleanObject(get(settingsStoreAtom))
    return {
      ...base,
      ...store,
      saved: Object.entries(store).length > 0,
      inUrl: false,
    } as Settings
  },
  (get, set, val: Settings) => {
    const { saved, inUrl, ...settingsToStore } = val

    set(settingsBaseAtom, val)

    if (saved) {
      set(settingsStoreAtom, settingsToStore)
    } else {
      localStorage.removeItem('lean4web:settings')
    }
  },
)

/** Indicates whether mobile layout should be used */
export const mobileAtom = atom((get) => {
  const mobile_setting = get(settingsAtom).mobile
  if (mobile_setting === 'auto') {
    const width = get(screenWidthAtom)
    return width < 800
  }
  return mobile_setting
})
