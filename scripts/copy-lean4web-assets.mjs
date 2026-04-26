#!/usr/bin/env node
// Script to copy lean4web static assets from node_modules to public/
// Run: node scripts/copy-lean4web-assets.mjs

import { cpSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const nodeModules = join(root, 'node_modules')
const publicDir = join(root, 'public')

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

// Copy @leanprover/infoview dist files to public/infoview/
const infoviewSrc = join(nodeModules, '@leanprover/infoview/dist')
const infoviewDest = join(publicDir, 'infoview')
ensureDir(infoviewDest)

const infoviewFiles = [
  'index.production.min.js',
  'loader.production.min.js',
  'react.production.min.js',
  'react-dom.production.min.js',
  'react-jsx-runtime.production.min.js',
  'index.css',
]
for (const f of infoviewFiles) {
  cpSync(join(infoviewSrc, f), join(infoviewDest, f))
}

// Copy infoview subdirectory if it exists
const infoviewSubdir = join(infoviewSrc, 'infoview')
if (existsSync(infoviewSubdir)) {
  cpSync(infoviewSubdir, join(infoviewDest, 'infoview'), { recursive: true })
}

// Copy lean4monaco webview.js to public/infoview/
cpSync(
  join(nodeModules, 'lean4monaco/dist/webview/webview.js'),
  join(infoviewDest, 'webview.js')
)

// Copy codicon.ttf to public/assets/ and public/infoview/
const assetsDest = join(publicDir, 'assets')
ensureDir(assetsDest)
cpSync(
  join(infoviewSrc, 'codicon.ttf'),
  join(assetsDest, 'codicon.ttf')
)
cpSync(
  join(infoviewSrc, 'codicon.ttf'),
  join(infoviewDest, 'codicon.ttf')
)

// Copy fonts if available
const fontsSrc = join(nodeModules, 'lean4monaco/dist/fonts')
if (existsSync(fontsSrc)) {
  const fontsDest = join(publicDir, 'fonts')
  ensureDir(fontsDest)
  cpSync(fontsSrc, fontsDest, { recursive: true })
}

console.log('lean4web assets copied to public/')

// Create perf_hooks browser stub in node_modules (vscode package needs it)
import { writeFileSync } from 'fs'
const perfHooksDir = join(nodeModules, 'perf_hooks')
ensureDir(perfHooksDir)
writeFileSync(join(perfHooksDir, 'index.js'),
  `exports.performance = globalThis.performance || { timeOrigin: Date.now(), now: function() { return Date.now(); } };\n`
)
writeFileSync(join(perfHooksDir, 'package.json'),
  `{"name":"perf_hooks","version":"1.0.0","main":"index.js"}\n`
)
