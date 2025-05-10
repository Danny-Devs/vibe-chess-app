import type { Piece } from '../types'

// Checkmate position: Black is in checkmate (White's move just checkmated Black)
export const CHECKMATE_POSITION: Piece[] = [
  // White pieces
  { id: 'wk', type: 'king', color: 'white', square: 'e1', hasMoved: true },
  { id: 'wq', type: 'queen', color: 'white', square: 'h7', hasMoved: true },
  { id: 'wr1', type: 'rook', color: 'white', square: 'a1', hasMoved: false },

  // Black pieces (minimal setup - king only is in a checkmate position)
  { id: 'bk', type: 'king', color: 'black', square: 'h8', hasMoved: true },
]

// Stalemate position: Black is in stalemate (no legal moves but not in check)
export const STALEMATE_POSITION: Piece[] = [
  // White pieces
  { id: 'wk', type: 'king', color: 'white', square: 'g6', hasMoved: true },
  { id: 'wq', type: 'queen', color: 'white', square: 'g7', hasMoved: true },

  // Black pieces (king only is in a stalemate position)
  { id: 'bk', type: 'king', color: 'black', square: 'h8', hasMoved: true },
]

// One-move checkmate scenario: White to move and deliver checkmate in one move
export const ONE_MOVE_CHECKMATE: Piece[] = [
  // White pieces
  { id: 'wk', type: 'king', color: 'white', square: 'e1', hasMoved: false },
  { id: 'wq', type: 'queen', color: 'white', square: 'h5', hasMoved: true }, // Queen ready to deliver checkmate

  // Black pieces
  { id: 'bk', type: 'king', color: 'black', square: 'e8', hasMoved: false },
  { id: 'bp1', type: 'pawn', color: 'black', square: 'f7', hasMoved: false },
  { id: 'bp2', type: 'pawn', color: 'black', square: 'g7', hasMoved: false },
]

// Almost stalemate: With Black to move, one move away from stalemate
export const ALMOST_STALEMATE: Piece[] = [
  // White pieces
  { id: 'wk', type: 'king', color: 'white', square: 'g6', hasMoved: true },
  { id: 'wq', type: 'queen', color: 'white', square: 'a8', hasMoved: true }, // Queen will move to g7 to cause stalemate

  // Black pieces
  { id: 'bk', type: 'king', color: 'black', square: 'h8', hasMoved: true },
]

// Capture test position: Position with pieces ready to capture
export const CAPTURE_TEST_POSITION: Piece[] = [
  // White pieces
  { id: 'wk', type: 'king', color: 'white', square: 'e1', hasMoved: false },
  { id: 'wq', type: 'queen', color: 'white', square: 'd1', hasMoved: false },
  { id: 'wp1', type: 'pawn', color: 'white', square: 'e4', hasMoved: true }, // Pawn that can capture
  { id: 'wb1', type: 'bishop', color: 'white', square: 'c4', hasMoved: true }, // Bishop that can capture
  { id: 'wn1', type: 'knight', color: 'white', square: 'd4', hasMoved: true }, // Knight that can capture

  // Black pieces
  { id: 'bk', type: 'king', color: 'black', square: 'e8', hasMoved: false },
  { id: 'bp1', type: 'pawn', color: 'black', square: 'd5', hasMoved: true }, // Pawn that can be captured by white pawn
  { id: 'bp2', type: 'pawn', color: 'black', square: 'f5', hasMoved: true }, // Pawn that can be captured by white pawn
  { id: 'bp3', type: 'pawn', color: 'black', square: 'b5', hasMoved: true }, // Pawn that can be captured by white bishop
  { id: 'br1', type: 'rook', color: 'black', square: 'c6', hasMoved: true }, // Rook that can be captured by white knight
]
