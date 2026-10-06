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
      ignoreHorizontalScrollbarInContentHeight: true
    },
    lightbulb: {
      enabled: monaco.editor.ShowLightbulbIconMode.Off
    },

    ...(isTouchDevice ? {
      inertialScroll: true,
      mouseWheelScrollSensitivity: 10,
      scrollPredominantAxis: false,
      smoothScrolling: true,
      contextmenu: false,
      stickyScroll: { enabled: false },
      wordWrap: 'on',
      wordWrapIndicator: true,
      acceptSuggestionOnEnter: 'off'
    } : {})
  })

  const touchTargets = retainTouchTargets(editor)

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
      editor.setModel(models[tab])
      editor.restoreViewState(viewStates[tab] ?? null)
    },

    setTheme(isDark) {
      monaco.editor.setTheme(themeFor(isDark))
    },

    dispose() {
      touchTargets.dispose()
      editor.dispose()
      Object.values(models).forEach(model => model.dispose())
      dtsLib.dispose()
    }

  }

}
