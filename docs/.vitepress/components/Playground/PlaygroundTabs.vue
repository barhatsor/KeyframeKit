<template>
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab"
      class="tab"
      :class="{ active: activeTab === tab }"
      @click="activeTab = tab"
    >
      {{ tab }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Tab } from './types'

defineProps<{ tabs: Tab[] }>()

const activeTab = defineModel<Tab>({ required: true })
</script>

<style scoped>
.tabs {
  display: flex;
  flex-shrink: 0;
  padding: 0 12px;
  background-color: var(--vp-code-tab-bg);
  box-shadow: inset 0 -1px var(--vp-code-tab-divider);
}

@media (max-width: 1000px) {
  .tabs {
    margin-top: -49px;
  }
}

.tab {
  position: relative;
  display: inline-block;
  border-bottom: 1px solid transparent;
  padding: 0 12px;
  line-height: 48px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-code-tab-text-color);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.25s;
}
.tab:hover {
  color: var(--vp-code-tab-hover-text-color);
}
.tab.active {
  color: var(--vp-code-tab-active-text-color);
}

.tab::after {
  position: absolute;
  right: 8px;
  bottom: -1px;
  left: 8px;
  z-index: 1;
  height: 2px;
  border-radius: 2px;
  content: '';
  background-color: transparent;
}
.tab.active::after {
  background-color: var(--vp-code-tab-active-bar-color);
}
</style>
