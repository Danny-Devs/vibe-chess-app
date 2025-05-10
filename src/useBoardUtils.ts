import { computed } from 'vue'
import { RANKS, FILES } from './constants/boardConfig'
import type { SquareColor, Square } from './types'
import { useGameStore } from './stores/gameStore'

export function getFlippedSquareColor(originalColor: SquareColor, isFlipped: boolean): SquareColor {
  return isFlipped ? (originalColor === 'light' ? 'dark' : 'light') : originalColor
}
