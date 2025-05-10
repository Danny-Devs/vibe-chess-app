<template>
  <div
    class="chess-piece"
    :class="[
      `piece-${piece.color}`,
      { selected: isSelected },
      { 'in-check': isInCheck },
      { 'is-dragging': isDragging },
    ]"
    :data-piece-id="piece.id"
    :data-piece-square="piece.square"
    @click.stop="handleClick($event)"
    @mousedown.stop="$emit('mousedown', $event)"
  >
    {{ getPieceLetter(piece.type) }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Piece, PieceType } from '../../types'
import { FILES, RANKS } from '../../constants/boardConfig'
import { useGameStore } from '../../stores/gameStore'

interface Props {
  piece: Piece
  isSelected?: boolean
  isInCheck?: boolean
  isDragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isInCheck: false,
  isDragging: false,
})

defineEmits(['click', 'mousedown'])

const gameStore = useGameStore()

function handleClick(event: MouseEvent) {
  // Emit click event with piece data
  const { piece } = props
  const isCurrentPlayerPiece = piece.color === gameStore.currentTurn

  if (isCurrentPlayerPiece) {
    // For own pieces, use the standard selectPiece
    gameStore.selectPiece(piece.id)
  } else {
    // For enemy pieces, we need to check if a piece is already selected that can capture this one
    const selectedPieceId = gameStore.selectedPieceId
    if (selectedPieceId) {
      const selectedPiece = gameStore.pieces.find((p) => p.id === selectedPieceId)
      if (selectedPiece) {
        // Try to perform the capture directly
        console.log('Attempting to capture from ChessPiece click:', {
          from: selectedPiece.square,
          to: piece.square,
        })
        gameStore.movePiece(selectedPiece.square, piece.square)
      }
    }
  }
}

// Get the letter representation of each piece type
const getPieceLetter = (type: PieceType): string => {
  const letters: Record<PieceType, string> = {
    pawn: 'P',
    rook: 'R',
    knight: 'N', // using N for kNight to match standard chess notation
    bishop: 'B',
    queen: 'Q',
    king: 'K',
  }
  return letters[type]
}
</script>

<style scoped>
.chess-piece {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  font-size: clamp(1.2rem, 3vw, 2.5rem);
  font-weight: bold;
  user-select: none;
  z-index: 10;
  position: relative;
  transition: all 0.2s ease;
}

.chess-piece::before {
  content: '';
  position: absolute;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  z-index: -1;
  transition: all 0.2s ease;
}

/* White pieces */
.piece-white {
  color: white;
  text-shadow:
    0px 0px 1px #000,
    0px 0px 2px #000;
}

.piece-white::before {
  background-color: rgba(255, 255, 255, 0.15);
}

/* Black pieces */
.piece-black {
  color: #222;
  text-shadow:
    0px 0px 1px #999,
    0px 0px 2px rgba(255, 255, 255, 0.5);
}

.piece-black::before {
  background-color: rgba(0, 0, 0, 0.08);
}

/* Selected piece styling - ENHANCED */
.selected {
  transform: scale(1.15);
  z-index: 20;
}

.selected::before {
  background-color: rgba(120, 255, 120, 0.55); /* light green */
  width: 60%;
  height: 60%;
  box-shadow: none;
}

/* Dragging piece style */
.is-dragging {
  opacity: 0.9;
  z-index: 50;
}

.is-dragging::before {
  display: none; /* Hide the background completely */
}

/* Chess piece hover effect */
.chess-piece:hover {
  transform: scale(1.1);
}

/* Check indicator */
.in-check::before {
  background-color: rgba(255, 50, 50, 0.3);
  box-shadow: 0 0 10px 2px rgba(255, 0, 0, 0.6);
  animation: pulse-check 1.5s infinite;
}

@keyframes pulse-check {
  0% {
    box-shadow: 0 0 5px 2px rgba(255, 0, 0, 0.6);
  }
  50% {
    box-shadow: 0 0 15px 2px rgba(255, 0, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 5px 2px rgba(255, 0, 0, 0.6);
  }
}
</style>
