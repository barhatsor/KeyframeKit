// Client-only: monaco and its workers can't run during SSR, so this
// directory is only loaded through `useEditor`'s dynamic import.

import * as monaco from 'monaco-editor'

import './workers'
import { setupHighlighting, themeFor } from './highlighting'
import { retainTouchTargets } from './touchTargets'

import type { Tab, Playground, PlaygroundOptions } from '../types'

function setupKeyframeKitTypes(dtsSource: string) {
  monaco.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.typescript.ScriptTarget.ESNext,
    module: monaco.typescript.ModuleKind.ESNext,
    allowNonTsExtensions: true,
    allowImportingTsExtensions: true,
    paths: {
      keyframekit: ['file:///KeyframeKit']
    },
    baseUrl: './'
  })

  return monaco.typescript.typescriptDefaults.addExtraLib(
    dtsSource,
    'file:///KeyframeKit.d.ts'
  )
}

/**
 * VitePress opens search when "/" is pressed on the page, unless the key's
 * target is an input, textarea or contenteditable. In Chromium, monaco takes
 * input through an EditContext <div>, which is none of those, so "/" would
 * open search instead of being typed. VitePress listens on `window`, so we
 * stop "/" at the container, after monaco's own handlers have seen it.
 */
function keepSearchShortcutOut(container: HTMLElement): monaco.IDisposable {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === '/') event.stopPropagation()
  }

  container.addEventListener('keydown', onKeyDown)

  return {
    dispose: () => container.removeEventListener('keydown', onKeyDown)
  }
}

function createModel(value: string, language: string, uriStr: string) {
  const uri = monaco.Uri.parse(uriStr)

  // free the URI if a previous playground instance left a model behind
  monaco.editor.getModel(uri)?.dispose()

  return monaco.editor.createModel(value, language, uri)
}

export async function createPlayground(
  { container, code, dtsSource, isDark, isTouchDevice, onChange }: PlaygroundOptions
): Promise<Playground> {

  await setupHighlighting()

  const dtsLib = setupKeyframeKitTypes(dtsSource)

  const models: Record<Tab, monaco.editor.ITextModel> = {
    // Mark as lang: typescript so we can see the full type annotations on hover,
    // but suffix the file with .js so as to not allow actual type annotations in the file's code.
    JS: createModel(code.JS, 'typescript', 'file:///main.js'),
    CSS: createModel(code.CSS, 'css', 'file:///style.css'),
    HTML: createModel(code.HTML, 'html', 'file:///index.html')
  }

  const editor = monaco.editor.create(container, {
    model: models.JS,
    theme: themeFor(isDark),

    fontSize: 16,
    fontFamily: 'var(--vp-font-family-mono)',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    padding: { top: 20, bottom: 20 },
    automaticLayout: true,
    fixedOverflowWidgets: true,
    renderLineHighlightOnlyWhenFocus: true,

    tabSize: 2,
    lineNumbers: 'off',
    scrollbar: {
      // once the editor is scrolled to its top or bottom,
      // let the wheel scroll the page instead
      alwaysConsumeMouseWheel: false,
      ignoreHorizontalScrollbarInContentHeight: true,
      ...(isTouchDevice ? {
        verticalScrollbarSize: 10,
        verticalSliderSize: 4,
        horizontalScrollbarSize: 10,
        horizontalSliderSize: 4
      } : {})
    },
    lightbulb: {
      enabled: monaco.editor.ShowLightbulbIconMode.Off
    },

    ...(isTouchDevice ? {
      inertialScroll: true,
      // mouseWheelScrollSensitivity: 10,
      // scrollPredominantAxis: false,
      contextmenu: false,
      stickyScroll: { enabled: false },
      overviewRulerLanes: 0,
      quickSuggestions: 'off',
      suggestOnTriggerCharacters: false,
      parameterHints: { enabled: false }
    } : {})
  })

  const touchTargets = retainTouchTargets(editor)
  const searchShortcut = keepSearchShortcutOut(container)

  let currentTab: Tab = 'JS'
  const viewStates: Partial<Record<Tab, monaco.editor.ICodeEditorViewState | null>> = {}

  editor.onDidChangeModelContent(() => {
    onChange(currentTab, editor.getValue())
  })

  return {

    showTab(tab) {
      if (tab === currentTab) return
      viewStates[currentTab] = editor.saveViewState()
      currentTab = tab
      // Detach the current model first, as VS Code does when switching editors.
      // Swapping models directly would keep the previous model's sticky scroll
      // header up until the new model's is computed (~300ms); with no model
      // in between, monaco clears it right away.
      editor.setModel(null)
      editor.setModel(models[tab])
      editor.restoreViewState(viewStates[tab] ?? null)
    },

    setTheme(isDark) {
      monaco.editor.setTheme(themeFor(isDark))
    },

    dispose() {
      touchTargets.dispose()
      searchShortcut.dispose()
      editor.dispose()
      Object.values(models).forEach(model => model.dispose())
      dtsLib.dispose()
    }

  }

}
