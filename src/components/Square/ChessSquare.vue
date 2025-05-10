<template>
  <div class="chess-square" :class="[color]" :data-square="square">
    <div v-if="showCoordinates && showRankLabel" class="coordinate rank-label">
      {{ square[1] }}
    </div>
    <div v-if="showCoordinates && showFileLabel" class="coordinate file-label">
      {{ square[0] }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SquareColor, Square } from '../../types'
import { FILES, RANKS } from '../../constants/boardConfig'

interface Props {
  square: Square
  color: SquareColor
  showCoordinates?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true,
})

// Show rank labels only on the a-file (leftmost column)
const showRankLabel = computed(() => {
  return props.square[0] === 'a'
})

// Show file labels only on the 1-rank (bottom row)
const showFileLabel = computed(() => {
  return props.square[1] === '1'
})
</script>

<style scoped>
.chess-square {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.light {
  background-color: var(--light-square-color, #f0d9b5);
}

.dark {
  background-color: var(--dark-square-color, #b58863);
}

.coordinate {
  position: absolute;
  font-size: 1rem;
  opacity: 0.9;
  pointer-events: none;
  color: rgba(0, 0, 0, 0.8);
  font-weight: bold;
}

/* Rank labels (left side) */
.rank-label {
  left: 8px;
  bottom: 5px;
}

/* File labels (bottom) */
.file-label {
  right: 8px;
  bottom: 5px;
}

/* Improve contrast for dark squares */
.dark .coordinate {
  color: rgba(255, 255, 255, 0.95);
}
</style>
