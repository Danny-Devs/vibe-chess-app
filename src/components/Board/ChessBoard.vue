<template>
  <div class="chess-board-container">
    <div class="chess-board" :class="{ 'board-flipped': gameStore.config.flipped }">
      <!-- Board squares -->
      <ChessSquare
        v-for="square in boardSquares"
        :key="square"
        :square="square"
        :color="getSquareColor(square[0], square[1], gameStore.config.squaresFlipped)"
        :showCoordinates="showCoordinates"
        :isValidMoveTarget="
          gameStore.config.showAvailableMoves && gameStore.isValidMoveTarget(square)
        "
        @click="gameStore.handleSquareClick(square)"
      />

      <!-- Chess pieces -->
      <div class="pieces-container">
        <ChessPiece
          v-for="piece in gameStore.pieces"
          :key="piece.id"
          :piece="piece"
          :isSelected="piece.id === gameStore.selectedPieceId"
          :boardFlipped="gameStore.config.flipped"
          :isInCheck="piece.id === gameStore.check.kingId"
          @click="gameStore.selectPiece(piece.id)"
        />
      </div>

      <!-- Validation feedback tooltip -->
      <div
        v-if="gameStore.lastValidation.reason"
        class="validation-tooltip"
        :class="`tooltip-${gameStore.lastValidation.feedbackType}`"
      >
        {{ gameStore.lastValidation.reason }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import type { Square, SquareColor } from '../../types'
import ChessSquare from '../Square/ChessSquare.vue'
import { ChessPiece } from '../Pieces'
import { useBoardUtils } from '../../composables/useBoardUtils'
import { useGameStore } from '../../stores/gameStore'

interface Props {
  showCoordinates?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true,
})

const { generateBoardSquares } = useBoardUtils()
const boardSquares = generateBoardSquares

// Get the game store from Pinia
const gameStore = useGameStore()

// Modified getSquareColor function that takes flipped state into account
function getSquareColor(file: string, rank: string, flipped: boolean): SquareColor {
  const fileIndex = 'abcdefgh'.indexOf(file)
  const rankIndex = '87654321'.indexOf(rank)

  const isLight = (fileIndex + rankIndex) % 2 === 1
  return flipped ? (isLight ? 'dark' : 'light') : isLight ? 'light' : 'dark'
}

// Track the last validation reason for tooltip display
const tooltipVisible = ref(false)

// Watch for changes in the validation result
watch(
  () => gameStore.lastValidation.reason,
  (newReason) => {
    if (newReason) {
      tooltipVisible.value = true
      setTimeout(() => {
        tooltipVisible.value = false
      }, 3000) // Hide after 3 seconds
    }
  },
)

// Start a new game when component is mounted - but only if status is idle
onMounted(() => {
  if (gameStore.status === 'idle') {
    // Don't auto-start the game, let user click "Start Game" button
  }
})
</script>

<style scoped>
.chess-board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0;
}

.chess-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  border: 2px solid #333;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

/* Add styles for flipped board */
.board-flipped {
  transform: rotate(180deg);
}

.board-flipped :deep(.chess-piece) {
  transform: rotate(180deg);
}

.board-flipped :deep(.chess-piece:hover) {
  transform: rotate(180deg) scale(1.1);
}

.pieces-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  pointer-events: none;
  z-index: 10;
}

.pieces-container > :deep(*) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.pieces-container :deep(.chess-piece) {
  pointer-events: auto;
  transition: transform 0.2s ease;
}

/* Validation tooltip */
.validation-tooltip {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  color: white;
  z-index: 100;
  pointer-events: none;
  animation: fadeIn 0.3s ease-out;
}

.tooltip-error {
  background-color: rgba(220, 53, 69, 0.9);
}

.tooltip-warning {
  background-color: rgba(255, 193, 7, 0.9);
}

.tooltip-info {
  background-color: rgba(13, 202, 240, 0.9);
}

.tooltip-success {
  background-color: rgba(40, 167, 69, 0.9);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
