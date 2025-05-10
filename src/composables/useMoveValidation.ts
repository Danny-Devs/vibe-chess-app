import type { Piece, Square, PieceType } from '../types'
import { FILES, RANKS } from '../constants/boardConfig'

export function useMoveValidation() {
  // Convert square to coordinates (0-7 for both file and rank)
  function squareToCoords(square: Square): [number, number] {
    const file = FILES.indexOf(square[0] as any)
    const rank = RANKS.indexOf(square[1] as any)
    return [file, rank]
  }

  // Convert coordinates back to square notation
  function coordsToSquare(file: number, rank: number): Square | null {
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null
    return `${FILES[file]}${RANKS[rank]}` as Square
  }

  // Check if a square is occupied by a piece
  function isSquareOccupied(square: Square, pieces: Piece[]): boolean {
    return pieces.some((piece) => piece.square === square)
  }

  // Check if a square is occupied by an opponent's piece
  function isSquareOccupiedByOpponent(
    square: Square,
    currentPiece: Piece,
    pieces: Piece[],
  ): boolean {
    const pieceAtSquare = pieces.find((piece) => piece.square === square)
    return pieceAtSquare ? pieceAtSquare.color !== currentPiece.color : false
  }

  // Get valid moves for a pawn
  function getPawnMoves(piece: Piece, pieces: Piece[]): Square[] {
    const validMoves: Square[] = []
    const [file, rank] = squareToCoords(piece.square)
    const direction = piece.color === 'white' ? -1 : 1 // White moves up (-1 in rank), black moves down (+1 in rank)

    // Forward move (1 square)
    const oneForward = coordsToSquare(file, rank + direction)
    if (oneForward && !isSquareOccupied(oneForward, pieces)) {
      validMoves.push(oneForward)

      // Forward move (2 squares) - only from starting position
      if (!piece.hasMoved) {
        const twoForward = coordsToSquare(file, rank + 2 * direction)
        if (twoForward && !isSquareOccupied(twoForward, pieces)) {
          validMoves.push(twoForward)
        }
      }
    }

    // Capture moves (diagonally)
    const captureSquares = [
      coordsToSquare(file - 1, rank + direction),
      coordsToSquare(file + 1, rank + direction),
    ]

    captureSquares.forEach((square) => {
      if (square && isSquareOccupiedByOpponent(square, piece, pieces)) {
        validMoves.push(square)
      }
    })

    return validMoves
  }

  // Get valid moves for a rook
  function getRookMoves(piece: Piece, pieces: Piece[]): Square[] {
    const validMoves: Square[] = []
    const [file, rank] = squareToCoords(piece.square)

    // Define the four directions a rook can move (up, right, down, left)
    const directions = [
      [0, -1], // up
      [1, 0], // right
      [0, 1], // down
      [-1, 0], // left
    ]

    // Check each direction
    directions.forEach(([dx, dy]) => {
      let newFile = file
      let newRank = rank

      while (true) {
        newFile += dx
        newRank += dy

        const newSquare = coordsToSquare(newFile, newRank)
        if (!newSquare) break // Off the board

        if (isSquareOccupied(newSquare, pieces)) {
          if (isSquareOccupiedByOpponent(newSquare, piece, pieces)) {
            validMoves.push(newSquare) // Can capture opponent's piece
          }
          break // Can't move past a piece
        }

        validMoves.push(newSquare)
      }
    })

    return validMoves
  }

  // Get valid moves for a knight
  function getKnightMoves(piece: Piece, pieces: Piece[]): Square[] {
    const validMoves: Square[] = []
    const [file, rank] = squareToCoords(piece.square)

    // All possible knight moves
    const knightMoves = [
      [1, 2],
      [2, 1],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-2, 1],
      [-1, 2],
    ]

    knightMoves.forEach(([dx, dy]) => {
      const newSquare = coordsToSquare(file + dx, rank + dy)
      if (newSquare) {
        if (
          !isSquareOccupied(newSquare, pieces) ||
          isSquareOccupiedByOpponent(newSquare, piece, pieces)
        ) {
          validMoves.push(newSquare)
        }
      }
    })

    return validMoves
  }

  // Get valid moves for a bishop
  function getBishopMoves(piece: Piece, pieces: Piece[]): Square[] {
    const validMoves: Square[] = []
    const [file, rank] = squareToCoords(piece.square)

    // Define the four diagonal directions a bishop can move
    const directions = [
      [1, -1], // up-right
      [1, 1], // down-right
      [-1, 1], // down-left
      [-1, -1], // up-left
    ]

    // Check each direction
    directions.forEach(([dx, dy]) => {
      let newFile = file
      let newRank = rank

      while (true) {
        newFile += dx
        newRank += dy

        const newSquare = coordsToSquare(newFile, newRank)
        if (!newSquare) break // Off the board

        if (isSquareOccupied(newSquare, pieces)) {
          if (isSquareOccupiedByOpponent(newSquare, piece, pieces)) {
            validMoves.push(newSquare) // Can capture opponent's piece
          }
          break // Can't move past a piece
        }

        validMoves.push(newSquare)
      }
    })

    return validMoves
  }

  // Get valid moves for a queen (combination of rook and bishop)
  function getQueenMoves(piece: Piece, pieces: Piece[]): Square[] {
    return [...getRookMoves(piece, pieces), ...getBishopMoves(piece, pieces)]
  }

  // Get valid moves for a king
  function getKingMoves(piece: Piece, pieces: Piece[]): Square[] {
    const validMoves: Square[] = []
    const [file, rank] = squareToCoords(piece.square)

    // All possible king moves (8 directions)
    const kingMoves = [
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ]

    kingMoves.forEach(([dx, dy]) => {
      const newSquare = coordsToSquare(file + dx, rank + dy)
      if (newSquare) {
        if (
          !isSquareOccupied(newSquare, pieces) ||
          isSquareOccupiedByOpponent(newSquare, piece, pieces)
        ) {
          validMoves.push(newSquare)
        }
      }
    })

    return validMoves
  }

  // Get all valid moves for a piece
  function getValidMoves(piece: Piece, pieces: Piece[]): Square[] {
    switch (piece.type) {
      case 'pawn':
        return getPawnMoves(piece, pieces)
      case 'rook':
        return getRookMoves(piece, pieces)
      case 'knight':
        return getKnightMoves(piece, pieces)
      case 'bishop':
        return getBishopMoves(piece, pieces)
      case 'queen':
        return getQueenMoves(piece, pieces)
      case 'king':
        return getKingMoves(piece, pieces)
      default:
        return []
    }
  }

  // Check if a move is valid
  function isValidMove(piece: Piece, targetSquare: Square, pieces: Piece[]): boolean {
    const validMoves = getValidMoves(piece, pieces)
    return validMoves.includes(targetSquare)
  }

  return {
    isValidMove,
    getValidMoves,
    squareToCoords,
    coordsToSquare,
    isSquareOccupied,
    isSquareOccupiedByOpponent,
  }
}
