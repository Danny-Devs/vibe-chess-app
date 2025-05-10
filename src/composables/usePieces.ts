import { ref, computed } from 'vue'
import type { Piece, Square, PieceColor, PieceType } from '../types'
import { INITIAL_POSITION } from '../constants/pieceConfig'
import { useBoardUtils } from './useBoardUtils'

export function usePieces() {
  const { squareToCoordinates } = useBoardUtils()
  const pieces = ref<Piece[]>([...INITIAL_POSITION])

  // Find a piece at a specific square
  const getPieceAtSquare = (square: Square): Piece | undefined => {
    return pieces.value.find((piece) => piece.square === square)
  }

  // Get all pieces of a specific color
  const getPiecesByColor = (color: PieceColor) => {
    return computed(() => pieces.value.filter((piece) => piece.color === color))
  }

  // Get piece by ID
  const getPieceById = (id: string): Piece | undefined => {
    return pieces.value.find((piece) => piece.id === id)
  }

  // Move a piece to a new square
  const movePiece = (pieceId: string, targetSquare: Square) => {
    const pieceIndex = pieces.value.findIndex((p) => p.id === pieceId)
    if (pieceIndex >= 0) {
      // Create a new array with the updated piece
      pieces.value = pieces.value.map((p, index) => {
        if (index === pieceIndex) {
          return { ...p, square: targetSquare, hasMoved: true }
        }
        return p
      })
    }
  }

  // Remove a piece from the board (when captured)
  const removePiece = (pieceId: string) => {
    pieces.value = pieces.value.filter((p) => p.id !== pieceId)
  }

  // Reset pieces to initial position
  const resetPieces = () => {
    pieces.value = [...INITIAL_POSITION]
  }

  return {
    pieces,
    getPieceAtSquare,
    getPiecesByColor,
    getPieceById,
    movePiece,
    removePiece,
    resetPieces,
  }
}
