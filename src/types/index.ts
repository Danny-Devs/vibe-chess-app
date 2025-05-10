export type SquareColor = 'light' | 'dark'
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
export type Square = `${File}${Rank}`
export type BoardPosition = {
  file: File
  rank: Rank
}

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
export type PieceColor = 'white' | 'black'

export interface Piece {
  id: string
  type: PieceType
  color: PieceColor
  square: Square
  hasMoved?: boolean
}

// Move types
export type MoveType = 'normal' | 'capture' | 'castle' | 'en-passant' | 'promotion'

export interface Move {
  piece: Piece
  from: Square
  to: Square
  type: MoveType
  capturedPiece?: Piece
  promotionPiece?: PieceType
  notation: string
}

export interface GameHistory {
  moves: Move[]
  positions: Piece[][]
}

export type GameStatus = 'idle' | 'ready' | 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw'

export interface GameState {
  pieces: Piece[]
  currentTurn: PieceColor
  selectedPieceId: string | null
  status: GameStatus
  check: {
    inCheck: boolean
    kingId: string | null
  }
  history: GameHistory
  availableMoves: Move[]
  config: {
    showAvailableMoves: boolean
    autoQueen: boolean
  }
}

// Direction vectors for piece movement
export type Direction = [number, number]

// Validation result types
export interface ValidationResult {
  valid: boolean
  reason?: string
  feedbackType: ValidationFeedbackType
}

export type ValidationFeedbackType = 'none' | 'success' | 'error' | 'warning' | 'info'

// Enhanced move interface
export interface MoveValidation {
  from: Square
  to: Square
  result: ValidationResult
}
