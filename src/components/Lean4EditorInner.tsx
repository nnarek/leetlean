"use client";

import '@/lib/lean4web/css/lean4web.css';

import { Provider, useAtom } from 'jotai';
import { LeanMonaco, LeanMonacoEditor } from 'lean4monaco';
import * as monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import Split from 'react-split';

import { codeAtom } from '@/lib/lean4web/editor/code-atoms';
import { mobileAtom, settingsAtom } from '@/lib/lean4web/settings/settings-atoms';
import { SettingsPopup } from '@/lib/lean4web/settings/SettingsPopup';
import { screenWidthAtom } from '@/lib/lean4web/store/window-atoms';
import { save } from '@/lib/lean4web/utils/SaveToFile';
import type { Theme } from '@/lib/lean4web/settings/settings-types';

const WSS_URL = 'wss://live.lean-lang.org/websocket/MathlibDemo';
const PROJECT_FOLDER = 'MathlibDemo';

interface Lean4EditorInnerProps {
  code?: string;
}

export default function Lean4EditorInner({ code: initialCode }: Lean4EditorInnerProps) {
  return (
    <Provider>
      <Lean4EditorCore initialCode={initialCode} />
    </Provider>
  );
}

/** Read host app theme from data-theme attribute */
function getHostTheme(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Map host theme to Monaco theme name */
function hostThemeToMonaco(hostTheme: 'light' | 'dark'): Theme {
  return hostTheme === 'light' ? 'Visual Studio Light' : 'Visual Studio Dark';
}

function buildVSCodeOptions(settings: { theme: string; wordWrap: boolean; acceptSuggestionOnEnter: boolean; showGoalNames: boolean; showExpectedType: boolean; abbreviationCharacter: string }) {
  return {
    'workbench.colorTheme': settings.theme,
    'editor.tabSize': 2,
    'editor.lightbulb.enabled': 'on',
    'editor.wordWrap': settings.wordWrap ? 'on' : 'off',
    'editor.wrappingStrategy': 'advanced',
    'editor.semanticHighlighting.enabled': true,
    'editor.acceptSuggestionOnEnter': settings.acceptSuggestionOnEnter ? 'on' : 'off',
    'lean4.input.eagerReplacementEnabled': true,
    'lean4.infoview.showGoalNames': settings.showGoalNames,
    'lean4.infoview.emphasizeFirstGoal': true,
    'lean4.infoview.showExpectedType': settings.showExpectedType,
    'lean4.infoview.showTooltipOnHover': false,
    'lean4.input.leader': settings.abbreviationCharacter,
  };
}

function Lean4EditorCore({ initialCode }: { initialCode?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const infoviewRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const leanMonacoRef = useRef<LeanMonaco | null>(null);
  const [settings, applySettings] = useAtom(settingsAtom);
  const [mobile] = useAtom(mobileAtom);
  const [, setScreenWidth] = useAtom(screenWidthAtom);
  const [code, setCode] = useAtom(codeAtom);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sync theme from host app (data-theme attribute) → settings atom
  useEffect(() => {
    const syncTheme = () => {
      const monacoTheme = hostThemeToMonaco(getHostTheme());
      if (settings.theme !== monacoTheme) {
        applySettings({ ...settings, theme: monacoTheme });
      }
    };
    syncTheme();
    const obs = new MutationObserver(syncTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, [settings, applySettings]);

  // Save screen width for mobile detection
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setScreenWidth]);

  // Initialize Monaco + LeanMonaco ONCE (does not depend on settings)
  useEffect(() => {
    if (!editorRef.current || !infoviewRef.current) return;

    console.debug('[LeetLean] Starting editor');
    const _leanMonaco = new LeanMonaco();
    const _leanMonacoEditor = new LeanMonacoEditor();

    _leanMonaco.setInfoviewElement(infoviewRef.current);

    let disposed = false;

    (async () => {
      try {
        await _leanMonaco.start({
          websocket: { url: WSS_URL },
          htmlElement: editorRef.current ?? undefined,
          vscode: buildVSCodeOptions(settings),
        });
        if (disposed) return;

        // Use localStorage code if present, otherwise use prop
        const savedCode = code;
        const codeToUse = savedCode || initialCode || '';

        const fileName = `${PROJECT_FOLDER}/${PROJECT_FOLDER}.lean`;
        await _leanMonacoEditor.start(editorRef.current!, fileName, codeToUse);
        if (disposed) return;

        setEditor(_leanMonacoEditor.editor);
        leanMonacoRef.current = _leanMonaco;

        // Keep code atom in sync with editor changes
        _leanMonacoEditor.editor?.onDidChangeModelContent(() => {
          setCode(_leanMonacoEditor.editor?.getModel()?.getValue()!);
        });

        // Go-to-definition: open docs link
        const editorService = (_leanMonacoEditor.editor as any)?._codeEditorService;
        if (editorService) {
          const openEditorBase = editorService.openCodeEditor.bind(editorService);
          editorService.openCodeEditor = async (input: any, source: any) => {
            const result = await openEditorBase(input, source);
            if (result === null) {
              let path = input.resource.path
                .replace(new RegExp('^.*/(?:lean|\.lake/packages/[^/]+/)'), '')
                .replace(new RegExp('\.lean$'), '');
              if (
                window.confirm(
                  `Do you want to open the docs?\n\n${path} (line ${input.options.selection.startLineNumber})`,
                )
              ) {
                const newTab = window.open(
                  `https://leanprover-community.github.io/mathlib4_docs/${path}.html`,
                  '_blank',
                );
                newTab?.focus();
              }
            }
            return null;
          };
        }
      } catch (err) {
        console.error('[LeetLean] Editor initialization error:', err);
      }
    })();

    return () => {
      disposed = true;
      leanMonacoRef.current = null;
      _leanMonacoEditor.dispose();
      _leanMonaco.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once on mount
  }, []);

  // Update VSCode options when settings change (without restarting editor)
  useEffect(() => {
    if (leanMonacoRef.current) {
      leanMonacoRef.current.updateVSCodeOptions(buildVSCodeOptions(settings));
    }
  }, [settings]);

  // Ctrl+S: save file
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
    }
  }, []);

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 's' &&
        code !== undefined
      ) {
        event.preventDefault();
        save(code);
      }
    },
    [code],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Disable context menu outside editor
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      const editorContainer = document.querySelector('.lean4web-root .codeview');
      if (editorContainer && !editorContainer.contains(event.target as Node)) {
        event.stopPropagation();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu, true);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  // Build "Open in new tab" URL
  const openInNewTabUrl = (() => {
    const currentCode = code || initialCode || '';
    if (!currentCode) return 'https://live.lean-lang.org';
    const encoded = encodeURIComponent(currentCode);
    return `https://live.lean-lang.org/#code=${encoded}`;
  })();

  return (
    <div className="lean4web-root monaco-editor">
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '4px 12px',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>
          Lean 4 Editor
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => leanMonacoRef.current?.restart()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: 'var(--muted)',
              padding: '2px 6px',
            }}
            title="Restart Lean server"
          >
            Restart
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: 'var(--muted)',
              padding: '2px 6px',
            }}
            title="Editor Settings"
          >
            Settings
          </button>
          <a
            href={openInNewTabUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              textDecoration: 'none',
              padding: '2px 6px',
            }}
            title="Open in lean4web"
          >
            Open in new tab ↗
          </a>
        </div>
      </div>

      {/* Editor + Infoview split */}
      <Split
        className={`editor ${dragging ? 'dragging' : ''}`}
        gutter={(_index, _direction) => {
          const gutter = document.createElement('div');
          gutter.className = 'gutter';
          return gutter;
        }}
        gutterStyle={(_dimension, gutterSize, _index) => {
          return {
            width: mobile ? '100%' : `${gutterSize}px`,
            height: mobile ? `${gutterSize}px` : '100%',
            cursor: mobile ? 'row-resize' : 'col-resize',
            'margin-left': mobile ? 0 : `-${gutterSize}px`,
            'margin-top': mobile ? `-${gutterSize}px` : 0,
            'z-index': 0,
          } as any;
        }}
        gutterSize={5}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
        sizes={mobile ? [50, 50] : [65, 35]}
        direction={mobile ? 'vertical' : 'horizontal'}
        style={{ flexDirection: mobile ? 'column' : 'row' }}
      >
        <div className="codeview-wrapper" style={mobile ? { width: '100%' } : { height: '100%' }}>
          <div ref={editorRef} className="codeview" />
        </div>
        <div
          ref={infoviewRef}
          className="vscode-light infoview"
          style={mobile ? { width: '100%' } : { height: '100%' }}
        />
      </Split>

      {/* Settings popup */}
      <SettingsPopup
        open={settingsOpen}
        handleClose={() => setSettingsOpen(false)}
        closeNav={() => {}}
      />
    </div>
  );
}
