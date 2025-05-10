import type { Square, File, Rank, Move, Piece, PieceType } from '../types'
import { FILES, RANKS } from '../constants/boardConfig'

/**
 * Converts file and rank indices to algebraic notation
 */
export function indicesToSquare(fileIndex: number, rankIndex: number): Square | null {
  if (fileIndex < 0 || fileIndex >= 8 || rankIndex < 0 || rankIndex >= 8) {
    return null
  }

  const file = FILES[fileIndex] as File
  const rank = RANKS[rankIndex] as Rank

  return `${file}${rank}` as Square
}

/**
 * Converts algebraic notation to file and rank indices
 */
export function squareToIndices(square: Square): [number, number] {
  const file = square.charAt(0) as File
  const rank = square.charAt(1) as Rank

  const fileIndex = FILES.indexOf(file as any)
  const rankIndex = RANKS.indexOf(rank as any)

  return [fileIndex, rankIndex]
}

/**
 * Generates the Standard Algebraic Notation (SAN) for a move
 */
export function generateMoveNotation(move: Move, pieces: Piece[]): string {
  const { piece, from, to, type, capturedPiece, promotionPiece } = move

  // Special case for castling
  if (type === 'castle') {
    // Kingside castle
    if (to.charAt(0) === 'g') {
      return 'O-O'
    }
    // Queenside castle
    return 'O-O-O'
  }

  // Piece letter (uppercase for all except pawns, which are lowercase or omitted)
  let notation = ''

  if (piece.type !== 'pawn') {
    notation += piece.type.charAt(0).toUpperCase()

    // Check for ambiguity (if another piece of same type can move to same square)
    const ambiguousPieces = pieces.filter(
      (p) => p.id !== piece.id && p.type === piece.type && p.color === piece.color,
    )

    if (ambiguousPieces.length > 0) {
      // Add disambiguation (file or rank)
      const fromFile = from.charAt(0)
      const fromRank = from.charAt(1)

      // Check if file is sufficient for disambiguation
      if (!ambiguousPieces.some((p) => p.square.charAt(0) === fromFile)) {
        notation += fromFile
      } else if (!ambiguousPieces.some((p) => p.square.charAt(1) === fromRank)) {
        notation += fromRank
      } else {
        // Need both file and rank
        notation += from
      }
    }
  } else if (type === 'capture') {
    // For pawn captures, include the file of the from square
    notation += from.charAt(0)
  }

  // Capture symbol
  if (type === 'capture' || type === 'en-passant') {
    notation += 'x'
  }

  // Destination square
  notation += to

  // Promotion
  if (type === 'promotion' && promotionPiece) {
    notation += '=' + promotionPiece.charAt(0).toUpperCase()
  }

  // Check and checkmate indicators will be added later

  return notation
}

/**
 * Parse a move in Standard Algebraic Notation (SAN)
 * Note: Simplified implementation, won't handle all edge cases
 */
export function parseMoveNotation(notation: string): Partial<Move> | null {
  // TODO: Implement SAN parsing in a future feature
  return null
}
