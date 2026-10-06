<template>
  <div class="playground">
    <div class="editor-pane">
      <PlaygroundTabs v-model="activeTab" :tabs="TABS" />
      <div class="editor-container">
        <!-- vp-raw: keep the theme's doc styles out of monaco (see `postcssIsolateStyles` in config.ts) -->
        <div ref="editorEl" class="editor-mount vp-raw" />
        <PlaygroundLoader v-if="!isReady" />
      </div>
    </div>

    <div class="preview-pane">
      <iframe ref="previewEl" class="preview-frame" sandbox="allow-scripts" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue'

import PlaygroundTabs from './PlaygroundTabs.vue'
import PlaygroundLoader from './PlaygroundLoader.vue'

import type { Tab } from './types.js'
import { getDefaultExample } from './resources/defaultExample.js'
import { fetchPlaygroundLib } from './lib.js'
import { useEditor } from './useEditor.js'
import { usePreview, type PreviewSource } from './usePreview.js'

const TABS: Tab[] = ['JS', 'CSS', 'HTML']
const activeTab = ref<Tab>('JS')

const editorEl = useTemplateRef<HTMLDivElement>('editorEl')
const previewEl = useTemplateRef<HTMLIFrameElement>('previewEl')

const source: PreviewSource = {
  code: { JS: '', CSS: '', HTML: '' },
  importMap: ''
}

const preview = usePreview(previewEl, source)
const { isReady, mountEditor } = useEditor(editorEl, activeTab)

onMounted(async () => {
  const isTouchDevice = window.matchMedia('(hover: none)').matches

  Object.assign(source.code, getDefaultExample({ isTouchDevice }))

  const { dtsSource, importMap } = await fetchPlaygroundLib()
  source.importMap = importMap

  preview.update()

  await mountEditor({
    code: source.code,
    dtsSource,
    isTouchDevice,
    onChange(tab, value) {
      source.code[tab] = value
      preview.scheduleUpdate()
    }
  })
})
</script>

<style scoped>
.playground {
  display: flex;
  height: 500px;
  --border-radius: 8px;
  border-radius: var(--border-radius);
  overflow: hidden;
}

@media (max-width: 1000px) {
  .playground {
    flex-flow: column-reverse;
    gap: 49px;
  }
  .playground .preview-pane {
    border-bottom-width: 0;
    border-left-width: 1px;
    border-radius: var(--border-radius) var(--border-radius) 0 0;
  }
}

@media (max-width: 640px) {
  .playground {
    margin-left: -24px;
    margin-right: -24px;
    --border-radius: 0;
  }
  .playground .preview-pane {
    border-right-width: 0;
    border-left-width: 0;
  }
}

.editor-pane {
  display: flex;
  flex-direction: column;
  background: var(--vp-code-block-bg);
  flex: 1;
}

.editor-container {
  flex: 1;
  position: relative;
}
.editor-mount {
  width: 100%;
  height: 100%;
  position: absolute;
}

.preview-pane {
  border: 1px solid var(--vp-code-block-bg);
  border-left-width: 0;
  flex: 1;
  display: flex;
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  overflow: hidden;
  background: #f0f7ff;
}

.preview-frame {
  flex: 1;
  width: 100%;
  border: none;
}
</style>
