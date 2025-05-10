<template>
  <div class="chess-board-container">
    <div
      class="chess-board"
      :class="{
        'game-inactive': !gameStore.gameStarted,
      }"
      ref="boardRef"
    >
      <!-- Board squares -->
      <ChessSquare
        v-for="square in boardSquares"
        :key="square"
        :square="square"
        :color="getSquareColor(square[0], square[1])"
        :showCoordinates="showCoordinates"
        :isValidMoveTarget="isValidMoveForSquare(square)"
        :isDropTarget="isCurrentDropTarget(square)"
        @click="gameStore.handleSquareClick(square)"
        ref="squareRefs"
      />

      <!-- Chess pieces -->
      <div class="pieces-container">
        <div
          v-for="piece in gameStore.pieces"
          :key="piece.id"
          :style="
            piece.id === draggedPieceId ? draggedPieceStyle : getPieceGridPosition(piece.square)
          "
          class="piece-wrapper"
          :class="{ 'piece-dragging': piece.id === draggedPieceId }"
          ref="pieceRefs"
        >
          <ChessPiece
            :piece="piece"
            :isSelected="piece.id === gameStore.selectedPieceId"
            :isInCheck="piece.id === gameStore.check.kingId"
            :isDragging="piece.id === draggedPieceId"
            @click.stop="gameStore.selectPiece(piece.id, $event)"
            @mousedown.stop="startDrag(piece, $event)"
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
import { onMounted, ref, watch, computed, onUnmounted } from 'vue'
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

const { generateBoardSquares, getSquareColor } = useBoardUtils()
const boardSquares = generateBoardSquares

// Get the game store from Pinia
const gameStore = useGameStore()

// Drag and drop refs
const boardRef = ref<HTMLElement | null>(null)
const pieceRefs = ref<HTMLElement[]>([])
const squareRefs = ref<HTMLElement[]>([])

// Drag state
const draggedPieceId = ref<string | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })
const draggedPieceStyle = ref({})
const draggedPieceOriginalSquare = ref<Square | null>(null)
const currentDropTarget = ref<Square | null>(null)

// Function to start the game when clicking the overlay
function startGame() {
  gameStore.startNewGame()
}

// Function to determine if a square should show as a valid move target
function isValidMoveForSquare(square: Square): boolean {
  const showMoves = gameStore.config.showAvailableMoves
  const gameActive = gameStore.gameStarted
  const validMove = gameStore.isValidMoveTarget(square)

  return showMoves && gameActive && validMove
}

// Function to check if the square is the current drop target
function isCurrentDropTarget(square: Square): boolean {
  return currentDropTarget.value === square && isValidMoveForSquare(square)
}

// Function to get piece grid position according to the board state
function getPieceGridPosition(square: Square) {
  const file = square.charAt(0)
  const rank = square.charAt(1)

  // Calculate 1-based grid positions
  const fileIndex = 'abcdefgh'.indexOf(file) + 1
  const rankIndex = '87654321'.indexOf(rank) + 1

  return {
    gridColumn: fileIndex,
    gridRow: rankIndex,
  }
}

// Start dragging a piece
function startDrag(piece: any, event: MouseEvent) {
  // Only allow dragging player's pieces during active game
  if (gameStore.status !== 'active' || piece.color !== gameStore.currentTurn) {
    return
  }

  // Select the piece to see available moves
  gameStore.selectPiece(piece.id)

  if (gameStore.availableMoves.length === 0) {
    // If no moves available, cancel drag
    return
  }

  // Set the dragged piece
  draggedPieceId.value = piece.id
  draggedPieceOriginalSquare.value = piece.square

  // Store the initial mouse position
  const pieceElement = event.currentTarget as HTMLElement
  const pieceRect = pieceElement.getBoundingClientRect()

  // Calculate offset from the cursor to the center of the piece
  dragOffset.value = {
    x: event.clientX - (pieceRect.left + pieceRect.width / 2),
    y: event.clientY - (pieceRect.top + pieceRect.height / 2),
  }

  // Set initial position immediately without any transitions
  if (boardRef.value) {
    const boardRect = boardRef.value.getBoundingClientRect()

    const x = event.clientX - boardRect.left - dragOffset.value.x
    const y = event.clientY - boardRect.top - dragOffset.value.y

    // Apply a simple position style without any transforms or transitions
    draggedPieceStyle.value = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: 100,
      pointerEvents: 'none',
      transition: 'none',
    }
  }

  // Add global event listeners
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

// Update the dragged piece position
function updateDragPosition(event: MouseEvent) {
  if (!draggedPieceId.value || !boardRef.value) return

  const boardRect = boardRef.value.getBoundingClientRect()

  // Calculate position relative to the board, accounting for the offset
  const x = event.clientX - boardRect.left - dragOffset.value.x
  const y = event.clientY - boardRect.top - dragOffset.value.y

  // Update the style for absolute positioning
  draggedPieceStyle.value = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
    pointerEvents: 'none',
    transition: 'none',
  }

  // Find the square under the cursor for drop targeting
  updateDropTarget(event)
}

// Find the square under the cursor
function updateDropTarget(event: MouseEvent) {
  if (!boardRef.value || !draggedPieceId.value) return

  // Find square under cursor
  const elements = document.elementsFromPoint(event.clientX, event.clientY)
  const squareElement = elements.find((el) => el.classList.contains('chess-square'))

  if (squareElement) {
    const square = squareElement.getAttribute('data-square') as Square

    // Only set as drop target if it's a valid move
    if (gameStore.isValidMoveTarget(square)) {
      currentDropTarget.value = square
    } else {
      currentDropTarget.value = null
    }
  } else {
    currentDropTarget.value = null
  }
}

// Handle drag move event
function handleDragMove(event: MouseEvent) {
  updateDragPosition(event)
}

// Handle drag end event
function handleDragEnd(event: MouseEvent) {
  // Remove event listeners
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)

  // Handle the drop
  if (draggedPieceId.value && currentDropTarget.value && draggedPieceOriginalSquare.value) {
    // Attempt to move the piece
    gameStore.movePiece(draggedPieceOriginalSquare.value, currentDropTarget.value)
  }

  // Reset drag state
  draggedPieceId.value = null
  draggedPieceOriginalSquare.value = null
  currentDropTarget.value = null
  draggedPieceStyle.value = {}
}

// Clean up event listeners when component is unmounted
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
})

// Track the last validation reason for tooltip display
const tooltipVisible = ref(false)

// Watch for validation changes
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
  border-radius: 0;
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

.piece-dragging {
  z-index: 100;
}

/* Validation tooltip */
.validation-tooltip {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  border-radius: 0;
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
