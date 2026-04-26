import { LeanMonacoEditor } from 'lean4monaco';
import * as monaco from 'monaco-editor';

export interface VerifyResult {
  valid: boolean;
  error?: string;
}

const PROJECT_FOLDER = 'MathlibDemo';

/**
 * Wait for Monaco diagnostics/markers to stabilize on a given model URI.
 * Resolves when no new marker changes arrive for `stableMs`, or after `timeoutMs`.
 */
function waitForDiagnostics(
  modelUri: monaco.Uri,
  stableMs = 3000,
  timeoutMs = 60000
): Promise<void> {
  return new Promise((resolve) => {
    let stableTimer: ReturnType<typeof setTimeout>;
    let timeoutTimer: ReturnType<typeof setTimeout>;

    const disposable = monaco.editor.onDidChangeMarkers((uris) => {
      if (uris.some((uri) => uri.toString() === modelUri.toString())) {
        clearTimeout(stableTimer);
        stableTimer = setTimeout(() => {
          clearTimeout(timeoutTimer);
          disposable.dispose();
          resolve();
        }, stableMs);
      }
    });

    // Start an initial stable timer
    stableTimer = setTimeout(() => {
      clearTimeout(timeoutTimer);
      disposable.dispose();
      resolve();
    }, stableMs);

    // Hard timeout fallback
    timeoutTimer = setTimeout(() => {
      clearTimeout(stableTimer);
      disposable.dispose();
      resolve();
    }, timeoutMs);
  });
}

/**
 * Verify a Lean 4 proof by creating a hidden editor with the code + `#print axioms`,
 * waiting for diagnostics, and checking for errors or `sorryAx` usage.
 *
 * Uses a separate hidden LeanMonacoEditor (different file) so the user's
 * visible editor is never modified.
 */
export async function verifyProof(
  mainEditor: monaco.editor.IStandaloneCodeEditor,
  theoremName: string
): Promise<VerifyResult> {
  const mainModel = mainEditor.getModel();
  if (!mainModel) {
    return { valid: false, error: 'No editor model found' };
  }

  const code = mainModel.getValue();
  const verifyCode = code + `\n\n#print axioms ${theoremName}\n`;

  // Create a hidden container for the verification editor
  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.position = 'fixed';
  hiddenContainer.style.left = '-9999px';
  hiddenContainer.style.top = '-9999px';
  hiddenContainer.style.width = '800px';
  hiddenContainer.style.height = '600px';
  hiddenContainer.style.opacity = '0';
  hiddenContainer.style.pointerEvents = 'none';
  document.body.appendChild(hiddenContainer);

  const verifyEditor = new LeanMonacoEditor();

  try {
    // Use a different filename so the LSP treats it as a separate file
    const verifyFileName = `${PROJECT_FOLDER}/verify_submission.lean`;
    await verifyEditor.start(hiddenContainer, verifyFileName, verifyCode);

    const verifyModel = verifyEditor.editor?.getModel();
    if (!verifyModel) {
      return { valid: false, error: 'Failed to create verification editor' };
    }

    // Wait for the Lean server to process diagnostics on the verification file
    await waitForDiagnostics(verifyModel.uri);

    // Read all markers on the verification model
    const markers = monaco.editor.getModelMarkers({ resource: verifyModel.uri });

    // Check for error-level diagnostics
    const errors = markers.filter(
      (m) => m.severity === monaco.MarkerSeverity.Error
    );
    if (errors.length > 0) {
      return { valid: false, error: `Code has errors: ${errors[0].message}` };
    }

    // Check for sorryAx in any info/warning/hint markers (from #print axioms output)
    const hasSorryAx = markers.some(
      (m) =>
        (m.severity === monaco.MarkerSeverity.Info ||
          m.severity === monaco.MarkerSeverity.Warning ||
          m.severity === monaco.MarkerSeverity.Hint) &&
        m.message.includes('sorryAx')
    );
    if (hasSorryAx) {
      return { valid: false, error: 'Proof uses sorry (sorryAx detected)' };
    }

    return { valid: true };
  } finally {
    verifyEditor.dispose();
    hiddenContainer.remove();
  }
}
