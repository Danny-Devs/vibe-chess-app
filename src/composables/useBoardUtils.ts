import { computed } from 'vue'
import { RANKS, FILES } from '../constants/boardConfig'
import type { SquareColor, Square } from '../types'

export function useBoardUtils() {
  /**
   * Determines if a square should be light or dark
   */
  const getSquareColor = (file: string, rank: string): SquareColor => {
    const fileIndex = FILES.indexOf(file as any)
    const rankIndex = RANKS.indexOf(rank as any)
    return (fileIndex + rankIndex) % 2 === 0 ? 'dark' : 'light'
  }

  /**
   * Generates all squares on the chess board in the correct order
   */
  const generateBoardSquares = computed((): Square[] => {
    const squares: Square[] = []

    for (const rank of RANKS) {
      for (const file of FILES) {
        squares.push(`${file}${rank}` as Square)
      }
    }

    return squares
  })

  /**
   * Converts algebraic notation (e.g., "e4") to board coordinates
   */
  const squareToCoordinates = (square: Square): { file: number; rank: number } => {
    const file = FILES.indexOf(square[0] as any)
    const rank = RANKS.indexOf(square[1] as any)
    return { file, rank }
  }

  return {
    getSquareColor,
    generateBoardSquares,
    squareToCoordinates,
  }
}
