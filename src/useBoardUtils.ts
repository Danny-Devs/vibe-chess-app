import { computed } from 'vue'
import { RANKS, FILES } from './constants/boardConfig'
import type { SquareColor, Square } from './types'
import { useGameStore } from './stores/gameStore'

// Functions below moved to useBoardUtils.ts compositional
