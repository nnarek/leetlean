"use client";

import '@/lib/lean4web/css/lean4web.css';

import { Provider, useAtom } from 'jotai';
import { LeanMonaco, LeanMonacoEditor, LeanMonacoOptions } from 'lean4monaco';
import * as monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import Split from 'react-split';

import { codeAtom } from '@/lib/lean4web/editor/code-atoms';
import { mobileAtom, settingsAtom } from '@/lib/lean4web/settings/settings-atoms';
import { SettingsPopup } from '@/lib/lean4web/settings/SettingsPopup';
import { lightThemes } from '@/lib/lean4web/settings/settings-types';
import { screenWidthAtom } from '@/lib/lean4web/store/window-atoms';
import { save } from '@/lib/lean4web/utils/SaveToFile';

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

function Lean4EditorCore({ initialCode }: { initialCode?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const infoviewRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const [leanMonaco, setLeanMonaco] = useState<LeanMonaco>();
  const [settings] = useAtom(settingsAtom);
  const [mobile] = useAtom(mobileAtom);
  const [, setScreenWidth] = useAtom(screenWidthAtom);
  const [code, setCode] = useAtom(codeAtom);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Track whether we've set the initial code from props
  const initialCodeSetRef = useRef(false);

  // Save screen width for mobile detection
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setScreenWidth]);

  // Build LeanMonaco options
  const [options, setOptions] = useState<LeanMonacoOptions>({
    websocket: { url: '' },
  });

  useEffect(() => {
    console.log('[LeetLean] Update lean4monaco options');
    const _options: LeanMonacoOptions = {
      websocket: { url: WSS_URL },
      htmlElement: editorRef.current ?? undefined,
      vscode: {
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
      },
    };
    setOptions(_options);
  }, [editorRef, settings]);

  // Initialize Monaco + LeanMonaco
  useEffect(() => {
    if (!options.websocket.url) return;

    console.debug('[LeetLean] Starting editor');
    const _leanMonaco = new LeanMonaco();
    const _leanMonacoEditor = new LeanMonacoEditor();

    _leanMonaco.setInfoviewElement(infoviewRef.current!);

    (async () => {
      await _leanMonaco.start(options);

      // Determine initial code: use URL hash code if present, otherwise use prop
      const editorCode = code || initialCode || '';
      // If no code in URL hash yet, and we have initialCode from props, use that
      const codeToUse = (!initialCodeSetRef.current && !code && initialCode)
        ? initialCode
        : (code || initialCode || '');
      initialCodeSetRef.current = true;

      const fileName = `${PROJECT_FOLDER}/${PROJECT_FOLDER}.lean`;
      await _leanMonacoEditor.start(editorRef.current!, fileName, codeToUse);

      setEditor(_leanMonacoEditor.editor);
      setLeanMonaco(_leanMonaco);

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
    })();

    return () => {
      _leanMonacoEditor.dispose();
      _leanMonaco.dispose();
    };
  }, [infoviewRef, editorRef, options]);

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
            onClick={() => leanMonaco?.restart()}
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
