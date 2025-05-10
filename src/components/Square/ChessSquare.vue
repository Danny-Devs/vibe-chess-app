<template>
  <div
    class="chess-square"
    :class="[
      color,
      { 'valid-move-target': isValidMoveTarget },
      { 'has-feedback': hasFeedback },
      feedbackClass,
    ]"
    :data-square="square"
    @click="$emit('click')"
  >
    <div v-if="showCoordinates && showRankLabel" class="coordinate rank-label">
      {{ square[1] }}
    </div>
    <div v-if="showCoordinates && showFileLabel" class="coordinate file-label">
      {{ square[0] }}
    </div>
    <div v-if="hasFeedback" class="feedback-animation"></div>
    <div v-if="isValidMoveTarget" class="valid-move-indicator"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SquareColor, Square, ValidationFeedbackType } from '../../types'
import { FILES, RANKS } from '../../constants/boardConfig'
import { useGameStore } from '../../stores/gameStore'

interface Props {
  square: Square
  color: SquareColor
  showCoordinates?: boolean
  isValidMoveTarget?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true,
  isValidMoveTarget: false,
})

defineEmits(['click'])

const gameStore = useGameStore()

const hasFeedback = computed(() => {
  return (
    gameStore.lastFeedbackSquare === props.square &&
    gameStore.lastValidation.feedbackType !== 'none'
  )
})

const feedbackClass = computed(() => {
  if (hasFeedback.value) {
    return `feedback-${gameStore.lastValidation.feedbackType}`
  }
  return ''
})

// Show rank labels on the a-file (leftmost column)
const showRankLabel = computed(() => {
  return props.square[0] === 'a'
})

// Show file labels on the 1-rank (bottom row)
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
  cursor: pointer;
}

.light {
  background-color: var(--light-square-color, #f0d9b5);
}

.dark {
  background-color: var(--dark-square-color, #b58863);
}

.coordinate {
  position: absolute;
  font-size: 0.9rem;
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

/* Valid move target styling */
.valid-move-target {
  position: relative;
  cursor: pointer;
}

/* Valid move indicator styling - ENHANCED */
.valid-move-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28%;
  height: 28%;
  background-color: rgba(75, 175, 80, 0.9);
  border-radius: 50%;
  z-index: 5;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0.8;
  }
}

/* Feedback styles */
.has-feedback {
  position: relative;
}

.feedback-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 15;
}

.feedback-success .feedback-animation {
  background-color: rgba(100, 255, 100, 0.3);
  animation: pulse-success 0.5s ease-in-out;
}

.feedback-error .feedback-animation {
  background-color: rgba(255, 100, 100, 0.3);
  animation: shake 0.4s ease-in-out;
}

.feedback-warning .feedback-animation {
  background-color: rgba(255, 200, 100, 0.3);
  animation: pulse-warning 0.5s ease-in-out;
}

.feedback-info .feedback-animation {
  background-color: rgba(100, 200, 255, 0.3);
  animation: pulse-info 0.5s ease-in-out;
}

@keyframes pulse-success {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes pulse-warning {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes pulse-info {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
