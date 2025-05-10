import type { PieceType, PieceColor, Piece, Square } from '../types'

// Golden ratio for sacred geometry proportions
export const GOLDEN_RATIO = 1.618

// Colors for the wireframe effect
export const PIECE_COLORS = {
  white: {
    primary: '#e6f0ff',
    secondary: '#99c2ff',
    outline: '#4d94ff',
    glow: 'rgba(77, 148, 255, 0.5)',
  },
  black: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    outline: '#0f3460',
    glow: 'rgba(15, 52, 96, 0.5)',
  },
}

// Size constants for pieces
export const PIECE_SCALE = 0.85 // Pieces take up 85% of square size

// Initial board setup
export const INITIAL_POSITION: Piece[] = [
  // White pieces
  { id: 'wr1', type: 'rook', color: 'white', square: 'a1', hasMoved: false },
  { id: 'wn1', type: 'knight', color: 'white', square: 'b1', hasMoved: false },
  { id: 'wb1', type: 'bishop', color: 'white', square: 'c1', hasMoved: false },
  { id: 'wq', type: 'queen', color: 'white', square: 'd1', hasMoved: false },
  { id: 'wk', type: 'king', color: 'white', square: 'e1', hasMoved: false },
  { id: 'wb2', type: 'bishop', color: 'white', square: 'f1', hasMoved: false },
  { id: 'wn2', type: 'knight', color: 'white', square: 'g1', hasMoved: false },
  { id: 'wr2', type: 'rook', color: 'white', square: 'h1', hasMoved: false },
  { id: 'wp1', type: 'pawn', color: 'white', square: 'a2', hasMoved: false },
  { id: 'wp2', type: 'pawn', color: 'white', square: 'b2', hasMoved: false },
  { id: 'wp3', type: 'pawn', color: 'white', square: 'c2', hasMoved: false },
  { id: 'wp4', type: 'pawn', color: 'white', square: 'd2', hasMoved: false },
  { id: 'wp5', type: 'pawn', color: 'white', square: 'e2', hasMoved: false },
  { id: 'wp6', type: 'pawn', color: 'white', square: 'f2', hasMoved: false },
  { id: 'wp7', type: 'pawn', color: 'white', square: 'g2', hasMoved: false },
  { id: 'wp8', type: 'pawn', color: 'white', square: 'h2', hasMoved: false },

  // Black pieces
  { id: 'br1', type: 'rook', color: 'black', square: 'a8', hasMoved: false },
  { id: 'bn1', type: 'knight', color: 'black', square: 'b8', hasMoved: false },
  { id: 'bb1', type: 'bishop', color: 'black', square: 'c8', hasMoved: false },
  { id: 'bq', type: 'queen', color: 'black', square: 'd8', hasMoved: false },
  { id: 'bk', type: 'king', color: 'black', square: 'e8', hasMoved: false },
  { id: 'bb2', type: 'bishop', color: 'black', square: 'f8', hasMoved: false },
  { id: 'bn2', type: 'knight', color: 'black', square: 'g8', hasMoved: false },
  { id: 'br2', type: 'rook', color: 'black', square: 'h8', hasMoved: false },
  { id: 'bp1', type: 'pawn', color: 'black', square: 'a7', hasMoved: false },
  { id: 'bp2', type: 'pawn', color: 'black', square: 'b7', hasMoved: false },
  { id: 'bp3', type: 'pawn', color: 'black', square: 'c7', hasMoved: false },
  { id: 'bp4', type: 'pawn', color: 'black', square: 'd7', hasMoved: false },
  { id: 'bp5', type: 'pawn', color: 'black', square: 'e7', hasMoved: false },
  { id: 'bp6', type: 'pawn', color: 'black', square: 'f7', hasMoved: false },
  { id: 'bp7', type: 'pawn', color: 'black', square: 'g7', hasMoved: false },
  { id: 'bp8', type: 'pawn', color: 'black', square: 'h7', hasMoved: false },
]
