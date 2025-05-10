// Initial game configuration
export const INITIAL_GAME_CONFIG = {
  flipped: false, // Whether the board is flipped (black at bottom)
  squaresFlipped: false, // Whether the square colors are flipped
  showAvailableMoves: true, // Whether to show available moves for selected piece
  autoQueen: true, // Automatically promote pawns to queens
}

// Game status descriptions
export const STATUS_MESSAGES = {
  idle: 'Game not started',
  ready: 'Ready to play',
  active: 'Game in progress',
  check: 'Check!',
  checkmate: 'Checkmate!',
  stalemate: 'Stalemate',
  draw: 'Draw',
}

// Movement direction vectors for different piece types
export const DIRECTION_VECTORS = {
  rook: [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0], // right, down, left, up
  ],
  bishop: [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1], // diagonals
  ],
  queen: [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0], // rook moves
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1], // bishop moves
  ],
  knight: [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2], // knight's L-shapes
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
  ],
  king: [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0], // horizontals and verticals
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1], // diagonals
  ],
  pawn: {
    white: [
      [0, -1], // forward
      [0, -2], // double forward (first move)
      [-1, -1],
      [1, -1], // captures
    ],
    black: [
      [0, 1], // forward
      [0, 2], // double forward (first move)
      [-1, 1],
      [1, 1], // captures
    ],
  },
}
