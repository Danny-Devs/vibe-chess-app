<template>
  <div class="chess-board-container">
    <div
      class="chess-board"
      :class="{
        'game-inactive': !gameStore.gameStarted,
        'board-flipped': gameStore.config.flipped,
      }"
    >
      <!-- Board squares -->
      <ChessSquare
        v-for="square in boardSquares"
        :key="square"
        :square="square"
        :color="getSquareColor(square[0], square[1], gameStore.config.squaresFlipped)"
        :showCoordinates="showCoordinates"
        :isValidMoveTarget="isValidMoveForSquare(square)"
        :boardFlipped="gameStore.config.flipped"
        @click="gameStore.handleSquareClick(square)"
      />

      <!-- Chess pieces -->
      <div class="pieces-container">
        <div
          v-for="piece in gameStore.pieces"
          :key="piece.id"
          :style="getPieceGridPosition(piece.square)"
          class="piece-wrapper"
        >
          <ChessPiece
            :piece="piece"
            :isSelected="piece.id === gameStore.selectedPieceId"
            :isInCheck="piece.id === gameStore.check.kingId"
            :boardFlipped="gameStore.config.flipped"
            @click.stop="gameStore.selectPiece(piece.id)"
          />
        </div>
      </div>

      <!-- Game inactive overlay - clickable to start the game -->
      <div v-if="!gameStore.gameStarted" class="game-inactive-overlay" @click="startGame">
        <span class="start-game-message">Click to Start Game</span>
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

// Function to start the game when clicking the overlay
function startGame() {
  gameStore.startNewGame()
}

// Function to determine if a square should show as a valid move target
function isValidMoveForSquare(square: Square): boolean {
  const showMoves = gameStore.config.showAvailableMoves
  const gameActive = gameStore.gameStarted
  const validMove = gameStore.isValidMoveTarget(square)

  // Only log when there's a selected piece, to avoid console spam
  if (gameStore.selectedPieceId !== null && validMove) {
    console.log(`Valid move for square ${square}: ${validMove}`)
  }

  return showMoves && gameActive && validMove
}

// Function to get piece grid position according to the board state
function getPieceGridPosition(square: Square) {
  const file = square.charAt(0)
  const rank = square.charAt(1)

  // Calculate 1-based grid positions
  let fileIndex = 'abcdefgh'.indexOf(file) + 1
  let rankIndex = '87654321'.indexOf(rank) + 1

  // When the board is flipped, we need to adjust coordinates
  if (gameStore.config.flipped) {
    fileIndex = 9 - fileIndex
    rankIndex = 9 - rankIndex
  }

  return {
    gridColumn: fileIndex,
    gridRow: rankIndex,
  }
}

// Modified getSquareColor function that takes flipped state into account
function getSquareColor(file: string, rank: string, flipped: boolean): SquareColor {
  const fileIndex = 'abcdefgh'.indexOf(file)
  const rankIndex = '87654321'.indexOf(rank)

  const isLight = (fileIndex + rankIndex) % 2 === 1
  return flipped ? (isLight ? 'dark' : 'light') : isLight ? 'light' : 'dark'
}

// Track the last validation reason for tooltip display
const tooltipVisible = ref(false)

// Watch for selection changes to make sure the UI updates
watch(
  () => gameStore.selectedPieceId,
  (newValue) => {
    if (newValue) {
      console.log(`Board watching: Piece selected: ${newValue}`)
    } else {
      console.log('Board watching: No piece selected')
    }
  },
)

// Watch for available moves changes
watch(
  () => gameStore.availableMoves,
  (newMoves) => {
    if (newMoves.length > 0) {
      console.log(`Board watching: ${newMoves.length} moves available`)
    }
  },
)

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

/* Board flipping */
.board-flipped {
  transform: rotate(180deg);
}

/* Game inactive styling */
.game-inactive {
  opacity: 0.8;
}

.game-inactive-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  cursor: pointer;
  transition: background-color 0.2s;
}

.game-inactive-overlay:hover {
  background-color: rgba(0, 0, 0, 0.4);
}

.start-game-message {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.game-inactive-overlay:hover .start-game-message {
  transform: scale(1.05);
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

.piece-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  pointer-events: auto;
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
  background-color: rgba(23, 162, 184, 0.9);
}

.tooltip-success {
  background-color: rgba(40, 167, 69, 0.9);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
