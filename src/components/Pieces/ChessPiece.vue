<template>
  <div
    class="chess-piece"
    :class="[
      `piece-${piece.color}`,
      { selected: isSelected },
      { 'in-check': isInCheck },
      { flipped: boardFlipped },
    ]"
    :data-piece-id="piece.id"
    @click.stop="$emit('click', $event)"
  >
    {{ getPieceLetter(piece.type) }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Piece, PieceType } from '../../types'
import { FILES, RANKS } from '../../constants/boardConfig'

interface Props {
  piece: Piece
  isSelected?: boolean
  isInCheck?: boolean
  boardFlipped?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isInCheck: false,
  boardFlipped: false,
})

defineEmits(['click'])

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

/* Handle flipped board */
.chess-piece.flipped {
  transform: rotate(180deg);
}

.chess-piece.flipped:hover {
  transform: rotate(180deg) scale(1.1);
}

.chess-piece.flipped.selected {
  transform: rotate(180deg) scale(1.15);
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
