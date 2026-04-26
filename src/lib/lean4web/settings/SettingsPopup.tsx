// LEETLEAN: Replaced MUI components (Switch, Slider, Box) with native HTML
// to avoid heavy @mui/material dependency. Styled with lean4web CSS variables.
import { useAtom } from 'jotai/react'
import { useState } from 'react'

import { Popup } from '../navigation/Popup'
import { shallowEqualSubset } from '../utils/shallowEqual'
import { settingsAtom } from './settings-atoms'
import type { MobileValues, Theme } from './settings-types'
import { defaultSettings, Settings } from './settings-types'

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <p className="lean4web-toggle-row">
      <label className="lean4web-toggle">
        <input id={id} type="checkbox" checked={checked} onChange={onChange} />
        <span className="lean4web-toggle-slider" />
      </label>
      <label htmlFor={id}>{label}</label>
    </p>
  )
}

export function SettingsPopup({
  open,
  handleClose,
  closeNav,
}: {
  open: boolean
  handleClose: () => void
  closeNav: () => void
}) {
  const [settings, applySettings] = useAtom(settingsAtom)
  const [newSettings, setNewSettings] = useState<Settings>(settings)

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setNewSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Popup open={open} handleClose={handleClose}>
      <form
        onSubmit={(ev) => {
          ev.preventDefault()
          handleClose()
          closeNav()
        }}
      >
        <h2>Editor settings</h2>
        <p>
          <label htmlFor="abbreviationCharacter">
            Lead character to trigger unicode input mode:
          </label>
          <input
            id="abbreviationCharacter"
            type="text"
            onChange={(ev) => {
              updateSetting('abbreviationCharacter', ev.target.value)
            }}
            value={newSettings.abbreviationCharacter}
          />
        </p>
        <Toggle
          id="wordWrap"
          checked={newSettings.wordWrap}
          onChange={() => updateSetting('wordWrap', !newSettings.wordWrap)}
          label="Wrap code"
        />
        <Toggle
          id="acceptSuggestionOnEnter"
          checked={newSettings.acceptSuggestionOnEnter}
          onChange={() => updateSetting('acceptSuggestionOnEnter', !newSettings.acceptSuggestionOnEnter)}
          label="Accept Suggestion on Enter"
        />
        <Toggle
          id="showGoalNames"
          checked={newSettings.showGoalNames}
          onChange={() => updateSetting('showGoalNames', !newSettings.showGoalNames)}
          label="Show Goal Names"
        />
        <Toggle
          id="showExpectedType"
          checked={newSettings.showExpectedType}
          onChange={() => updateSetting('showExpectedType', !newSettings.showExpectedType)}
          label="Show Expected Type"
        />

        <h2>User settings</h2>
        <p>
          <label htmlFor="theme">Theme: </label>
          <select
            id="theme"
            name="theme"
            value={newSettings.theme}
            onChange={(ev) => {
              updateSetting('theme', ev.target.value as Theme)
            }}
          >
            <option value="Visual Studio Light">visual studio light</option>
            <option value="Visual Studio Dark">visual studio dark</option>
            <option value="Default High Contrast">high contrast</option>
            <option value="Cobalt">cobalt</option>
          </select>
        </p>
        <p>
          <label htmlFor="mobile-layout">Layout: </label>
          <select
            id="mobile-layout"
            value={String(newSettings.mobile)}
            onChange={(ev) => {
              const val = ev.target.value
              const mobile: MobileValues = val === 'true' ? true : val === 'false' ? false : 'auto'
              updateSetting('mobile', mobile)
            }}
          >
            <option value="true">Mobile</option>
            <option value="auto">Auto</option>
            <option value="false">Desktop</option>
          </select>
        </p>
        <Toggle
          id="compress"
          checked={newSettings.compress}
          onChange={() => updateSetting('compress', !newSettings.compress)}
          label="Compress code in URL"
        />

        <h2>Save</h2>
        <p>
          <i>Editor settings and User settings are not preserved unless you opt-in to save them.</i>
        </p>
        <Toggle
          id="savingAllowed"
          checked={newSettings.saved}
          onChange={() => updateSetting('saved', !newSettings.saved)}
          label="Save settings (in the browser's local storage)"
        />
        <p>
          {!shallowEqualSubset(defaultSettings, newSettings) && (
            <button
              id="resetSettings"
              onClick={(e) => {
                setNewSettings({ saved: false, inUrl: false, ...defaultSettings })
                e.preventDefault()
              }}
            >
              Reset to Default
            </button>
          )}
          <input
            id="saveSettings"
            type="submit"
            value={newSettings.saved ? 'Apply & Save' : 'Apply'}
            onClick={() => applySettings(newSettings)}
          />
        </p>
      </form>
    </Popup>
  )
}
