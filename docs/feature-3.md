# Feature 3: Game State Management

## Description

Implement the core chess game state management system to track piece positions, turns, move history, and game status. This feature will provide the foundation for the game logic, move validation, and user interactions. It will use Vue 3's Reactivity API to maintain a reactive game state that updates the UI automatically when changes occur.

## Technical Implementation

### File Structure

Add the following files to the project:

```
src/
├── composables/
│   ├── useGameState.ts       # Main game state composable
│   ├── useChessRules.ts      # Chess rules and validation
│   └── useGameHistory.ts     # Move history tracking
├── constants/
│   └── gameConfig.ts         # Game-related constants
├── types/
│   └── index.ts              # Update with new game state types
└── utils/
    └── notationUtils.ts      # Chess notation conversion utilities
```

### Updated Types

Update `src/types/index.ts` with the following additions:

```typescript
// Existing types...

// Move types
export type MoveType = 'normal' | 'capture' | 'castle' | 'en-passant' | 'promotion';

export interface Move {
  piece: Piece;
  from: Square;
  to: Square;
  type: MoveType;
  capturedPiece?: Piece;
  promotionPiece?: PieceType;
  notation: string;
}

export interface GameHistory {
  moves: Move[];
  positions: Piece[][];
}

export type GameStatus = 'idle' | 'ready' | 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export interface GameState {
  pieces: Piece[];
  currentTurn: PieceColor;
  selectedPieceId: string | null;
  status: GameStatus;
  check: {
    inCheck: boolean;
    kingId: string | null;
  };
  history: GameHistory;
  availableMoves: Move[];
  config: {
    flipped: boolean;
    showAvailableMoves: boolean;
    autoQueen: boolean;
  };
}

// Direction vectors for piece movement
export type Direction = [number, number];
```

### Game Configuration Constants

Create `src/constants/gameConfig.ts`:

```typescript
// Initial game configuration
export const INITIAL_GAME_CONFIG = {
  flipped: false,       // Whether the board is flipped (black at bottom)
  showAvailableMoves: true, // Whether to show available moves for selected piece
  autoQueen: true,      // Automatically promote pawns to queens
};

// Game status descriptions
export const STATUS_MESSAGES = {
  idle: 'Game not started',
  ready: 'Ready to play',
  active: 'Game in progress',
  check: 'Check!',
  checkmate: 'Checkmate!',
  stalemate: 'Stalemate',
  draw: 'Draw'
};

// Movement direction vectors for different piece types
export const DIRECTION_VECTORS = {
  rook: [
    [0, 1], [1, 0], [0, -1], [-1, 0]  // right, down, left, up
  ],
  bishop: [
    [1, 1], [1, -1], [-1, -1], [-1, 1]  // diagonals
  ],
  queen: [
    [0, 1], [1, 0], [0, -1], [-1, 0],  // rook moves
    [1, 1], [1, -1], [-1, -1], [-1, 1]  // bishop moves
  ],
  knight: [
    [1, 2], [2, 1], [2, -1], [1, -2],  // knight's L-shapes
    [-1, -2], [-2, -1], [-2, 1], [-1, 2]
  ],
  king: [
    [0, 1], [1, 0], [0, -1], [-1, 0],  // horizontals and verticals
    [1, 1], [1, -1], [-1, -1], [-1, 1]  // diagonals
  ],
  pawn: {
    white: [
      [0, -1], // forward
      [0, -2], // double forward (first move)
      [-1, -1], [1, -1] // captures
    ],
    black: [
      [0, 1], // forward
      [0, 2], // double forward (first move)
      [-1, 1], [1, 1] // captures
    ]
  }
};
```

### Notation Utilities

Create `src/utils/notationUtils.ts`:

```typescript
import type { Square, File, Rank, Move, Piece, PieceType } from '../types';
import { FILES, RANKS } from '../constants/boardConfig';

/**
 * Converts file and rank indices to algebraic notation
 */
export function indicesToSquare(fileIndex: number, rankIndex: number): Square | null {
  if (fileIndex < 0 || fileIndex >= 8 || rankIndex < 0 || rankIndex >= 8) {
    return null;
  }
  
  const file = FILES[fileIndex] as File;
  const rank = RANKS[rankIndex] as Rank;
  
  return `${file}${rank}` as Square;
}

/**
 * Converts algebraic notation to file and rank indices
 */
export function squareToIndices(square: Square): [number, number] {
  const file = square.charAt(0) as File;
  const rank = square.charAt(1) as Rank;
  
  const fileIndex = FILES.indexOf(file as any);
  const rankIndex = RANKS.indexOf(rank as any);
  
  return [fileIndex, rankIndex];
}

/**
 * Generates the Standard Algebraic Notation (SAN) for a move
 */
export function generateMoveNotation(move: Move, pieces: Piece[]): string {
  const { piece, from, to, type, capturedPiece, promotionPiece } = move;
  
  // Special case for castling
  if (type === 'castle') {
    // Kingside castle
    if (to.charAt(0) === 'g') {
      return 'O-O';
    }
    // Queenside castle
    return 'O-O-O';
  }
  
  // Piece letter (uppercase for all except pawns, which are lowercase or omitted)
  let notation = '';
  
  if (piece.type !== 'pawn') {
    notation += piece.type.charAt(0).toUpperCase();
    
    // Check for ambiguity (if another piece of same type can move to same square)
    const ambiguousPieces = pieces.filter(p => 
      p.id !== piece.id && 
      p.type === piece.type && 
      p.color === piece.color
    );
    
    if (ambiguousPieces.length > 0) {
      // Add disambiguation (file or rank)
      const fromFile = from.charAt(0);
      const fromRank = from.charAt(1);
      
      // Check if file is sufficient for disambiguation
      if (!ambiguousPieces.some(p => p.square.charAt(0) === fromFile)) {
        notation += fromFile;
      } else if (!ambiguousPieces.some(p => p.square.charAt(1) === fromRank)) {
        notation += fromRank;
      } else {
        // Need both file and rank
        notation += from;
      }
    }
  } else if (type === 'capture') {
    // For pawn captures, include the file of the from square
    notation += from.charAt(0);
  }
  
  // Capture symbol
  if (type === 'capture' || type === 'en-passant') {
    notation += 'x';
  }
  
  // Destination square
  notation += to;
  
  // Promotion
  if (type === 'promotion' && promotionPiece) {
    notation += '=' + promotionPiece.charAt(0).toUpperCase();
  }
  
  // Check and checkmate indicators will be added later
  
  return notation;
}

/**
 * Parse a move in Standard Algebraic Notation (SAN)
 * Note: Simplified implementation, won't handle all edge cases
 */
export function parseMoveNotation(notation: string): Partial<Move> | null {
  // TODO: Implement SAN parsing in a future feature
  return null;
}
```

### Chess Rules Composable

Create `src/composables/useChessRules.ts`:

```typescript
import { computed } from 'vue';
import type { Piece, PieceColor, PieceType, Square, Move, MoveType, Direction } from '../types';
import { DIRECTION_VECTORS } from '../constants/gameConfig';
import { indicesToSquare, squareToIndices, generateMoveNotation } from '../utils/notationUtils';

export function useChessRules(pieces: Piece[]) {
  // Find a piece at a specific square
  const getPieceAtSquare = (square: Square): Piece | undefined => {
    return pieces.find(piece => piece.square === square);
  };
  
  // Check if a square is empty
  const isSquareEmpty = (square: Square): boolean => {
    return !getPieceAtSquare(square);
  };
  
  // Check if a square has an enemy piece
  const hasEnemyPiece = (square: Square, color: PieceColor): boolean => {
    const piece = getPieceAtSquare(square);
    return !!piece && piece.color !== color;
  };
  
  // Get the king of a specific color
  const getKing = (color: PieceColor): Piece | undefined => {
    return pieces.find(piece => piece.type === 'king' && piece.color === color);
  };
  
  // Generate all possible moves for a piece
  const generateMovesForPiece = (piece: Piece): Move[] => {
    if (!piece) return [];
    
    const moves: Move[] = [];
    const [fileIndex, rankIndex] = squareToIndices(piece.square);
    
    switch (piece.type) {
      case 'pawn':
        generatePawnMoves(piece, fileIndex, rankIndex, moves);
        break;
        
      case 'rook':
      case 'bishop':
      case 'queen':
        generateSlidingMoves(piece, fileIndex, rankIndex, moves);
        break;
        
      case 'knight':
        generateKnightMoves(piece, fileIndex, rankIndex, moves);
        break;
        
      case 'king':
        generateKingMoves(piece, fileIndex, rankIndex, moves);
        break;
    }
    
    return moves;
  };
  
  // Generate pawn moves
  const generatePawnMoves = (piece: Piece, fileIndex: number, rankIndex: number, moves: Move[]) => {
    const directions = DIRECTION_VECTORS.pawn[piece.color];
    const startingRank = piece.color === 'white' ? '2' : '7';
    const promotionRank = piece.color === 'white' ? '1' : '8';
    
    // Forward moves
    const forwardDir = directions[0];
    const newFileIndex = fileIndex + forwardDir[0];
    const newRankIndex = rankIndex + forwardDir[1];
    
    const forwardSquare = indicesToSquare(newFileIndex, newRankIndex);
    
    if (forwardSquare && isSquareEmpty(forwardSquare)) {
      // Check for promotion
      if (forwardSquare.charAt(1) === promotionRank) {
        addPawnPromotionMoves(piece, piece.square, forwardSquare, moves);
      } else {
        // Regular forward move
        moves.push({
          piece,
          from: piece.square,
          to: forwardSquare,
          type: 'normal',
          notation: generateMoveNotation({
            piece,
            from: piece.square,
            to: forwardSquare,
            type: 'normal'
          } as Move, pieces)
        });
      }
      
      // Double forward move from starting position
      if (piece.square.charAt(1) === startingRank) {
        const doubleForwardDir = directions[1];
        const doubleFileIndex = fileIndex + doubleForwardDir[0];
        const doubleRankIndex = rankIndex + doubleForwardDir[1];
        const doubleSquare = indicesToSquare(doubleFileIndex, doubleRankIndex);
        
        if (doubleSquare && isSquareEmpty(doubleSquare)) {
          moves.push({
            piece,
            from: piece.square,
            to: doubleSquare,
            type: 'normal',
            notation: generateMoveNotation({
              piece,
              from: piece.square,
              to: doubleSquare,
              type: 'normal'
            } as Move, pieces)
          });
        }
      }
    }
    
    // Capture moves
    const captureDirections = [directions[2], directions[3]];
    
    for (const dir of captureDirections) {
      const captureFileIndex = fileIndex + dir[0];
      const captureRankIndex = rankIndex + dir[1];
      const captureSquare = indicesToSquare(captureFileIndex, captureRankIndex);
      
      if (captureSquare && hasEnemyPiece(captureSquare, piece.color)) {
        const capturedPiece = getPieceAtSquare(captureSquare);
        
        // Check for promotion
        if (captureSquare.charAt(1) === promotionRank) {
          addPawnPromotionMoves(piece, piece.square, captureSquare, moves, capturedPiece);
        } else {
          // Regular capture
          moves.push({
            piece,
            from: piece.square,
            to: captureSquare,
            type: 'capture',
            capturedPiece,
            notation: generateMoveNotation({
              piece,
              from: piece.square,
              to: captureSquare,
              type: 'capture',
              capturedPiece
            } as Move, pieces)
          });
        }
      }
      
      // TODO: En passant will be implemented in Feature 8 (Advanced Chess Rules)
    }
  };
  
  // Helper for adding pawn promotion moves
  const addPawnPromotionMoves = (
    piece: Piece, 
    from: Square, 
    to: Square, 
    moves: Move[], 
    capturedPiece?: Piece
  ) => {
    const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
    const moveType: MoveType = capturedPiece ? 'capture' : 'normal';
    
    for (const promotionPiece of promotionPieces) {
      moves.push({
        piece,
        from,
        to,
        type: 'promotion',
        capturedPiece,
        promotionPiece,
        notation: generateMoveNotation({
          piece,
          from,
          to,
          type: 'promotion',
          capturedPiece,
          promotionPiece
        } as Move, pieces)
      });
    }
  };
  
  // Generate sliding moves (rook, bishop, queen)
  const generateSlidingMoves = (piece: Piece, fileIndex: number, rankIndex: number, moves: Move[]) => {
    let directions: Direction[] = [];
    
    // Get the appropriate direction vectors based on piece type
    if (piece.type === 'rook') {
      directions = DIRECTION_VECTORS.rook;
    } else if (piece.type === 'bishop') {
      directions = DIRECTION_VECTORS.bishop;
    } else if (piece.type === 'queen') {
      directions = DIRECTION_VECTORS.queen;
    }
    
    // Check each direction
    for (const dir of directions) {
      let newFileIndex = fileIndex;
      let newRankIndex = rankIndex;
      
      // Continue sliding until hitting edge of board, friendly piece, or capturing enemy piece
      while (true) {
        newFileIndex += dir[0];
        newRankIndex += dir[1];
        
        const newSquare = indicesToSquare(newFileIndex, newRankIndex);
        
        // Stop if we've moved off the board
        if (!newSquare) break;
        
        // Check if square has a piece
        const pieceAtSquare = getPieceAtSquare(newSquare);
        
        if (!pieceAtSquare) {
          // Empty square - add normal move
          moves.push({
            piece,
            from: piece.square,
            to: newSquare,
            type: 'normal',
            notation: generateMoveNotation({
              piece,
              from: piece.square,
              to: newSquare,
              type: 'normal'
            } as Move, pieces)
          });
        } else if (pieceAtSquare.color !== piece.color) {
          // Enemy piece - add capture and stop sliding
          moves.push({
            piece,
            from: piece.square,
            to: newSquare,
            type: 'capture',
            capturedPiece: pieceAtSquare,
            notation: generateMoveNotation({
              piece,
              from: piece.square,
              to: newSquare,
              type: 'capture',
              capturedPiece: pieceAtSquare
            } as Move, pieces)
          });
          break;
        } else {
          // Friendly piece - stop sliding
          break;
        }
      }
    }
  };
  
  // Generate knight moves
  const generateKnightMoves = (piece: Piece, fileIndex: number, rankIndex: number, moves: Move[]) => {
    const directions = DIRECTION_VECTORS.knight;
    
    for (const dir of directions) {
      const newFileIndex = fileIndex + dir[0];
      const newRankIndex = rankIndex + dir[1];
      const newSquare = indicesToSquare(newFileIndex, newRankIndex);
      
      // Skip if off the board
      if (!newSquare) continue;
      
      // Check if square has a piece
      const pieceAtSquare = getPieceAtSquare(newSquare);
      
      if (!pieceAtSquare) {
        // Empty square - add normal move
        moves.push({
          piece,
          from: piece.square,
          to: newSquare,
          type: 'normal',
          notation: generateMoveNotation({
            piece,
            from: piece.square,
            to: newSquare,
            type: 'normal'
          } as Move, pieces)
        });
      } else if (pieceAtSquare.color !== piece.color) {
        // Enemy piece - add capture
        moves.push({
          piece,
          from: piece.square,
          to: newSquare,
          type: 'capture',
          capturedPiece: pieceAtSquare,
          notation: generateMoveNotation({
            piece,
            from: piece.square,
            to: newSquare,
            type: 'capture',
            capturedPiece: pieceAtSquare
          } as Move, pieces)
        });
      }
    }
  };
  
  // Generate king moves
  const generateKingMoves = (piece: Piece, fileIndex: number, rankIndex: number, moves: Move[]) => {
    const directions = DIRECTION_VECTORS.king;
    
    for (const dir of directions) {
      const newFileIndex = fileIndex + dir[0];
      const newRankIndex = rankIndex + dir[1];
      const newSquare = indicesToSquare(newFileIndex, newRankIndex);
      
      // Skip if off the board
      if (!newSquare) continue;
      
      // Check if square has a piece
      const pieceAtSquare = getPieceAtSquare(newSquare);
      
      if (!pieceAtSquare) {
        // Empty square - add normal move
        moves.push({
          piece,
          from: piece.square,
          to: newSquare,
          type: 'normal',
          notation: generateMoveNotation({
            piece,
            from: piece.square,
            to: newSquare,
            type: 'normal'
          } as Move, pieces)
        });
      } else if (pieceAtSquare.color !== piece.color) {
        // Enemy piece - add capture
        moves.push({
          piece,
          from: piece.square,
          to: newSquare,
          type: 'capture',
          capturedPiece: pieceAtSquare,
          notation: generateMoveNotation({
            piece,
            from: piece.square,
            to: newSquare,
            type: 'capture',
            capturedPiece: pieceAtSquare
          } as Move, pieces)
        });
      }
    }
    
    // TODO: Castling will be implemented in Feature 8 (Advanced Chess Rules)
  };
  
  // Get all legal moves for a specific color
  const getLegalMovesForColor = (color: PieceColor): Move[] => {
    // We'll implement check/checkmate logic in Feature 9 (Game State Indicators)
    // For now, just return all moves for the color
    const colorPieces = pieces.filter(p => p.color === color);
    const allMoves: Move[] = [];
    
    for (const piece of colorPieces) {
      const pieceMoves = generateMovesForPiece(piece);
      allMoves.push(...pieceMoves);
    }
    
    return allMoves;
  };
  
  // Check if a move is valid
  const isValidMove = (from: Square, to: Square, color: PieceColor): boolean => {
    const piece = getPieceAtSquare(from);
    if (!piece || piece.color !== color) return false;
    
    const legalMoves = generateMovesForPiece(piece);
    return legalMoves.some(move => move.to === to);
  };
  
  // Find a specific move if it exists
  const findMove = (from: Square, to: Square): Move | undefined => {
    const piece = getPieceAtSquare(from);
    if (!piece) return undefined;
    
    const moves = generateMovesForPiece(piece);
    return moves.find(move => move.to === to);
  };
  
  return {
    getPieceAtSquare,
    isSquareEmpty,
    hasEnemyPiece,
    getKing,
    generateMovesForPiece,
    getLegalMovesForColor,
    isValidMove,
    findMove
  };
}
```

### Game History Composable

Create `src/composables/useGameHistory.ts`:

```typescript
import { ref, computed } from 'vue';
import type { Move, Piece, GameHistory } from '../types';

export function useGameHistory() {
  // Store the history of moves and positions
  const history = ref<GameHistory>({
    moves: [],
    positions: []
  });
  
  // Current position index (for navigating history)
  const currentPositionIndex = ref<number>(0);
  
  // List of all moves in standard notation
  const moveNotations = computed(() => {
    return history.value.moves.map(move => move.notation);
  });
  
  // Add a move to the history
  const addMove = (move: Move, newPosition: Piece[]) => {
    // If we're not at the end of history (i.e., we've navigated back), truncate
    if (currentPositionIndex.value < history.value.moves.length) {
      history.value.moves = history.value.moves.slice(0, currentPositionIndex.value);
      history.value.positions = history.value.positions.slice(0, currentPositionIndex.value + 1);
    }
    
    history.value.moves.push(move);
    history.value.positions.push([...newPosition]);
    currentPositionIndex.value = history.value.moves.length;
  };
  
  // Navigate to a specific position in history
  const goToPosition = (index: number): Piece[] => {
    if (index >= 0 && index <= history.value.positions.length - 1) {
      currentPositionIndex.value = index;
      return [...history.value.positions[index]];
    }
    return [];
  };
  
  // Go back one move
  const undoMove = (): Piece[] => {
    if (currentPositionIndex.value > 0) {
      currentPositionIndex.value--;
      return [...history.value.positions[currentPositionIndex.value]];
    }
    return [];
  };
  
  // Go forward one move
  const redoMove = (): Piece[] => {
    if (currentPositionIndex.value < history.value.positions.length - 1) {
      currentPositionIndex.value++;
      return [...history.value.positions[currentPositionIndex.value]];
    }
    return [];
  };
  
  // Reset history
  const resetHistory = (initialPosition: Piece[]) => {
    history.value = {
      moves: [],
      positions: [initialPosition]
    };
    currentPositionIndex.value = 0;
  };
  
  // Check if we can undo
  const canUndo = computed(() => currentPositionIndex.value > 0);
  
  // Check if we can redo
  const canRedo = computed(() => currentPositionIndex.value < history.value.positions.length - 1);
  
  // Get current move number
  const currentMoveNumber = computed(() => Math.floor((currentPositionIndex.value + 1) / 2));
  
  return {
    history,
    currentPositionIndex,
    moveNotations,
    addMove,
    goToPosition,
    undoMove,
    redoMove,
    resetHistory,
    canUndo,
    canRedo,
    currentMoveNumber
  };
}
```

### Game State Composable

Create `src/composables/useGameState.ts`:

```typescript
import { ref, reactive, computed } from 'vue';
import type { GameState, Piece, PieceColor, Square, Move, GameStatus } from '../types';
import { INITIAL_POSITION } from '../constants/pieceConfig';
import { INITIAL_GAME_CONFIG, STATUS_MESSAGES } from '../constants/gameConfig';
import { useChessRules } from './useChessRules';
import { useGameHistory } from './useGameHistory';

export function useGameState() {
  // Initialize the game state
  const gameState = reactive<GameState>({
    pieces: [...INITIAL_POSITION],
    currentTurn: 'white',
    selectedPieceId: null,
    status: 'idle',
    check: {
      inCheck: false,
      kingId: null
    },
    history: {
      moves: [],
      positions: [[...INITIAL_POSITION]]
    },
    availableMoves: [],
    config: { ...INITIAL_GAME_CONFIG }
  });
  
  // Set up chess rules
  const { 
    getPieceAtSquare,
    generateMovesForPiece,
    getLegalMovesForColor,
    isValidMove,
    findMove
  } = useChessRules(gameState.pieces);
  
  // Set up game history
  const { 
    addMove,
    undoMove,
    redoMove,
    resetHistory,
    canUndo,
    canRedo
  } = useGameHistory();
  
  // Get current status message
  const statusMessage = computed(() => {
    return STATUS_MESSAGES[gameState.status];
  });
  
  // Start a new game
  const startNewGame = () => {
    gameState.pieces = [...INITIAL_POSITION];
    gameState.currentTurn = 'white';
    gameState.selectedPieceId = null;
    gameState.status = 'ready';
    gameState.check = { inCheck: false, kingId: null };
    gameState.availableMoves = [];
    
    // Reset history
    resetHistory([...INITIAL_POSITION]);
    
    // Start the game
    gameState.status = 'active';
  };
  
  // Select a piece
  const selectPiece = (pieceId: string | null) => {
    // Can only select pieces of current player's color during active game
    if (pieceId !== null && gameState.status === 'active') {
      const piece = gameState.pieces.find(p => p.id === pieceId);
      if (piece && piece.color === gameState.currentTurn) {
        gameState.selectedPieceId = pieceId;
        gameState.availableMoves = generateMovesForPiece(piece);
      }
    } else {
      gameState.selectedPieceId = null;
      gameState.availableMoves = [];
    }
  };
  
  // Move a piece
  const movePiece = (from: Square, to: Square): boolean => {
    // Check if game is active
    if (gameState.status !== 'active') return false;
    
    // Find the move if it exists
    const move = findMove(from, to);
    if (!move) return false;
    
    // Make sure the piece belongs to the current player
    if (move.piece.color !== gameState.currentTurn) return false;
    
    // Execute the move
    executeMove(move);
    
    // Check for game end conditions (will be implemented in Feature 9)
    updateGameStatus();
    
    return true;
  };
  
  // Execute a move and update the game state
  const executeMove = (move: Move) => {
    const { piece, to, type, capturedPiece, promotionPiece } = move;
    
    // Create a new array with updated piece positions
    const newPieces = gameState.pieces.filter(p => {
      // Remove captured piece if any
      if (capturedPiece && p.id === capturedPiece.id) return false;
      return true;
    }).map(p => {
      // Update the moved piece
      if (p.id === piece.id) {
        if (type === 'promotion' && promotionPiece) {
          // Change the piece type for promotion
          return { ...p, square: to, type: promotionPiece, hasMoved: true };
        } else {
          // Regular move
          return { ...p, square: to, hasMoved: true };
        }
      }
      return p;
    });
    
    // Update the game state
    gameState.pieces = newPieces;
    
    // Switch turns
    gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
    
    // Clear selection
    gameState.selectedPieceId = null;
    gameState.availableMoves = [];
    
    // Add to history
    addMove(move, newPieces);
  };
  
  // Update the game status (check, checkmate, etc.)
  // This is a placeholder and will be fully implemented in Feature 9
  const updateGameStatus = () => {
    // For now, just keep the game active
    gameState.status = 'active';
  };
  
  // Undo the last move
  const handleUndoMove = () => {
    if (canUndo.value) {
      const previousPosition = undoMove();
      if (previousPosition.length > 0) {
        gameState.pieces = previousPosition;
        gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
        gameState.selectedPieceId = null;
        gameState.availableMoves = [];
      }
    }
  };
  
  // Redo the last undone move
  const handleRedoMove = () => {
    if (canRedo.value) {
      const nextPosition = redoMove();
      if (nextPosition.length > 0) {
        gameState.pieces = nextPosition;
        gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
        gameState.selectedPieceId = null;
        gameState.availableMoves = [];
      }
    }
  };
  
  // Check if a square is a valid move target
  const isValidMoveTarget = (square: Square): boolean => {
    if (!gameState.selectedPieceId) return false;
    
    const selectedPiece = gameState.pieces.find(p => p.id === gameState.selectedPieceId);
    if (!selectedPiece) return false;
    
    return gameState.availableMoves.some(move => move.to === square);
  };
  
  // Handle square click
  const handleSquareClick = (square: Square) => {
    // If a piece is already selected
    if (gameState.selectedPieceId) {
      const selectedPiece = gameState.pieces.find(p => p.id === gameState.selectedPieceId);
      
      // If clicking on the same piece, deselect it
      if (selectedPiece && selectedPiece.square === square) {
        selectPiece(null);
        return;
      }
      
      // If clicking on a valid target square, move the piece
      if (isValidMoveTarget(square)) {
        movePiece(selectedPiece!.square, square);
        return;
      }
      
      // If clicking on another piece of the same color, select it instead
      const clickedPiece = getPieceAtSquare(square);
      if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
        selectPiece(clickedPiece.id);
        return;
      }
      
      // Otherwise, deselect the current piece
      selectPiece(null);
    } else {
      // If no piece is selected, try to select the piece at the clicked square
      const clickedPiece = getPieceAtSquare(square);
      if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
        selectPiece(clickedPiece.id);
      }
    }
  };
  
  // Toggle board orientation
  const toggleBoardOrientation = () => {
    gameState.config.flipped = !gameState.config.flipped;
  };
  
  // Toggle showing available moves
  const toggleShowAvailableMoves = () => {
    gameState.config.showAvailableMoves = !gameState.config.showAvailableMoves;
  };
  
  // Toggle auto queen promotion
  const toggleAutoQueen = () => {
    gameState.config.autoQueen = !gameState.config.autoQueen;
  };
  
  return {
    gameState,
    statusMessage,
    startNewGame,
    selectPiece,
    movePiece,
    handleUndoMove,
    handleRedoMove,
    isValidMoveTarget,
    handleSquareClick,
    toggleBoardOrientation,
    toggleShowAvailableMoves,
    toggleAutoQueen
  };
}
```

### Update Board Component to Use Game State

Update `src/components/Board/ChessBoard.vue`:

```vue
<template>
  <div class="chess-board-container">
    <div class="chess-board" :class="{ 'board-flipped': gameState.config.flipped }">
      <!-- Board squares -->
      <ChessSquare
        v-for="square in boardSquares"
        :key="square"
        :square="square"
        :color="getSquareColor(square[0], square[1])"
        :showCoordinates="showCoordinates"
        :isValidMoveTarget="isValidMoveTarget(square)"
        @click="handleSquareClick(square)"
      />
      
      <!-- Chess pieces -->
      <div class="pieces-container">
        <ChessPiece
          v-for="piece in gameState.pieces"
          :key="piece.id"
          :piece="piece"
          :isSelected="piece.id === gameState.selectedPieceId"
          :boardFlipped="gameState.config.flipped"
          @click="selectPiece(piece.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Square } from '../../types';
import ChessSquare from '../Square/ChessSquare.vue';
import ChessPiece from '../Pieces/ChessPiece.vue';
import PieceDefinitions from '../Pieces/PieceDefinitions.vue';
import { useBoardUtils } from '../../composables/useBoardUtils';
import { useGameState } from '../../composables/useGameState';

interface Props {
  showCoordinates?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true
});

const { getSquareColor, generateBoardSquares } = useBoardUtils();
const boardSquares = generateBoardSquares;

// Get the game state
const { 
  gameState, 
  selectPiece, 
  isValidMoveTarget, 
  handleSquareClick 
} = useGameState();

// Start a new game when component is mounted
onMounted(() => {
  gameState.status = 'ready';
});
</script>

<style scoped>
/* Existing styles... */

/* Add new styles for valid move targets */
:deep(.valid-move-target) {
  position: relative;
}

:deep(.valid-move-target)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  background-color: rgba(100, 255, 100, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* Add styles for flipped board */
.board-flipped {
  transform: rotate(180deg);
}

.board-flipped :deep(.chess-piece) {
  transform: rotate(180deg);
}
</style>
```

### Update Square Component

Update `src/components/Square/ChessSquare.vue`:

```vue
<template>
  <div 
    class="chess-square" 
    :class="[
      color, 
      { 'valid-move-target': isValidMoveTarget }
    ]"
    :data-square="square"
    @click="$emit('click')"
  >
    <div class="coordinate" v-if="showCoordinates">
      {{ coordinateLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SquareColor, Square } from '../../types';
import { FILES, RANKS } from '../../constants/boardConfig';

interface Props {
  square: Square;
  color: SquareColor;
  showCoordinates?: boolean;
  isValidMoveTarget?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true,
  isValidMoveTarget: false
});

defineEmits(['click']);

// Same coordinateLabel computed as before...
const coordinateLabel = computed(() => {
  const file = props.square[0];
  const rank = props.square[1];
  
  // Show rank only on the first file (a)
  if (file === 'a') {
    return rank;
  }
  
  // Show file only on the last rank (1)
  if (rank === '1') {
    return file;
  }
  
  return '';
});
</script>

<style scoped>
/* Same styles as before, plus: */

.valid-move-target {
  cursor: pointer;
  position: relative;
}

.valid-move-target::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  background-color: rgba(100, 255, 100, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}
</style>
```

### Update ChessPiece Component

Update `src/components/Pieces/ChessPiece.vue`:

```vue
<template>
  <div 
    class="chess-piece" 
    :class="[
      `piece-${piece.type}`, 
      `piece-${piece.color}`, 
      { 'selected': isSelected }
    ]"
    :style="pieceStyle"
    :data-piece-id="piece.id"
    @click="$emit('click')"
  >
    <svg :viewBox="viewBox" class="piece-svg">
      <use :href="`#piece-${piece.type}`" class="piece-shape" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Piece } from '../../types';
import { useBoardUtils } from '../../composables/useBoardUtils';
import { PIECE_SCALE } from '../../constants/pieceConfig';

interface Props {
  piece: Piece;
  isSelected?: boolean;
  boardFlipped?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  boardFlipped: false
});

defineEmits(['click']);

const { squareToCoordinates } = useBoardUtils();

// Set the viewBox for the SVG pieces (standard chess piece dimensions)
const viewBox = "0 0 45 45";

// Calculate position styling based on the piece's square and board orientation
const pieceStyle = computed(() => {
  const coordinates = squareToCoordinates(props.piece.square);
  
  // Adjust for flipped board if needed
  const file = props.boardFlipped ? 7 - coordinates.file : coordinates.file;
  const rank = props.boardFlipped ? 7 - coordinates.rank : coordinates.rank;
  
  return {
    transform: `translate(${file * 100}%, ${rank * 100}%)`,
    width: `${PIECE_SCALE * 100}%`,
    height: `${PIECE_SCALE * 100}%`,
  };
});
</script>

<style scoped>
/* Same styles as before... */
</style>
```

### Update App.vue

Update `src/App.vue` to include game controls:

```vue
<template>
  <div class="app">
    <header class="header">
      <h1>Sacred Geometry Chess</h1>
      <div class="game-status">{{ statusMessage }}</div>
    </header>
    
    <main class="main-content">
      <div class="game-container">
        <ChessBoard :showCoordinates="true" />
        
        <div class="game-controls">
          <button @click="startNewGame">New Game</button>
          <button @click="handleUndoMove" :disabled="!canUndo">Undo</button>
          <button @click="handleRedoMove" :disabled="!canRedo">Redo</button>
          <button @click="toggleBoardOrientation">Flip Board</button>
          <label>
            <input type="checkbox" v-model="gameState.config.showAvailableMoves">
            Show Available Moves
          </label>
        </div>
      </div>
    </main>
    
    <footer class="footer">
      <p>Digital Wireframe Chess - Version 0.1</p>
    </footer>
    
    <!-- SVG Definitions for chess pieces -->
    <PieceDefinitions />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ChessBoard from './components/Board/ChessBoard.vue';
import PieceDefinitions from './components/Pieces/PieceDefinitions.vue';
import { useGameState } from './composables/useGameState';

const { 
  gameState, 
  statusMessage, 
  startNewGame, 
  handleUndoMove, 
  handleRedoMove, 
  toggleBoardOrientation 
} = useGameState();

const canUndo = computed(() => gameState.history.moves.length > 0);
const canRedo = computed(() => false); // Will be implemented more fully in a future feature
</script>

<style>
/* Existing global styles... */

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.game-status {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 0.5rem;
  color: var(--accent-color);
}

.game-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.game-controls button {
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.game-controls button:hover {
  background-color: #3a76d8;
}

.game-controls button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.game-controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}
</style>
```

## Dependencies

- Vue 3 with Composition API
- TypeScript

## Acceptance Criteria

1. The chessboard correctly displays the initial position of all chess pieces
2. Players can select a piece by clicking on it
3. When a piece is selected, valid move targets are highlighted
4. Players can move pieces by clicking on a valid target square
5. The game enforces turn-based play (white then black)
6. Players can start a new game, resetting the board to the initial position
7. Basic move validation works for all piece types (pawns, rooks, bishops, knights, queens, kings)
8. Players can undo and redo moves
9. The board can be flipped to view from either player's perspective
10. The game displays the current status (active, check, etc.)

## Unit Tests

Create a file `src/composables/__tests__/useGameState.spec.ts` with the following tests:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { useGameState } from '../useGameState';

describe('useGameState', () => {
  it('initializes with the correct default state', () => {
    const { gameState } = useGameState();
    
    expect(gameState.currentTurn).toBe('white');
    expect(gameState.status).toBe('idle');
    expect(gameState.selectedPieceId).toBeNull();
    expect(gameState.pieces.length).toBe(32);
    expect(gameState.config.flipped).toBe(false);
  });
  
  it('can start a new game', () => {
    const { gameState, startNewGame } = useGameState();
    
    // Change some values to verify reset
    gameState.currentTurn = 'black';
    gameState.status = 'checkmate';
    
    startNewGame();
    
    expect(gameState.currentTurn).toBe('white');
    expect(gameState.status).toBe('active');
    expect(gameState.selectedPieceId).toBeNull();
    expect(gameState.pieces.length).toBe(32);
  });
  
  it('can select a piece', () => {
    const { gameState, selectPiece, startNewGame } = useGameState();
    
    startNewGame();
    
    // Select a white piece
    selectPiece('wp1'); // White pawn 1
    
    expect(gameState.selectedPieceId).toBe('wp1');
    expect(gameState.availableMoves.length).toBeGreaterThan(0);
    
    // Try selecting a black piece (should fail on white's turn)
    selectPiece('bp1');
    
    expect(gameState.selectedPieceId).toBe('wp1'); // Should not change
  });
  
  it('can move a piece', () => {
    const { gameState, movePiece, startNewGame } = useGameState();
    
    startNewGame();
    
    // Move a white pawn forward
    const result = movePiece('e2', 'e4');
    
    expect(result).toBe(true);
    expect(gameState.currentTurn).toBe('black'); // Turn should switch
    
    // Verify the pawn moved
    const movedPawn = gameState.pieces.find(p => p.square === 'e4');
    expect(movedPawn).toBeDefined();
    expect(movedPawn?.type).toBe('pawn');
    expect(movedPawn?.color).toBe('white');
  });
  
  it('validates moves correctly', () => {
    const { gameState, movePiece, startNewGame } = useGameState();
    
    startNewGame();
    
    // Try an illegal move
    const result = movePiece('e2', 'e5'); // Pawn can't move 3 squares
    
    expect(result).toBe(false);
    expect(gameState.currentTurn).toBe('white'); // Turn should not change
    
    // Verify the pawn didn't move
    const unmoved = gameState.pieces.find(p => p.square === 'e2');
    expect(unmoved).toBeDefined();
    expect(unmoved?.type).toBe('pawn');
  });
  
  it('handles turn switching', () => {
    const { gameState, movePiece, startNewGame } = useGameState();
    
    startNewGame();
    
    // White's move
    movePiece('e2', 'e4');
    expect(gameState.currentTurn).toBe('black');
    
    // Black's move
    movePiece('e7', 'e5');
    expect(gameState.currentTurn).toBe('white');
    
    // Try to move black again (should fail)
    const result = movePiece('d7', 'd5');
    expect(result).toBe(false);
    expect(gameState.currentTurn).toBe('white');
  });
  
  it('tracks move history', () => {
    const { gameState, movePiece, startNewGame } = useGameState();
    
    startNewGame();
    
    movePiece('e2', 'e4');
    movePiece('e7', 'e5');
    
    expect(gameState.history.moves.length).toBe(2);
    expect(gameState.history.positions.length).toBe(3); // Initial + 2 moves
  });
});
```

## Challenges & Solutions

1. **Challenge**: Creating a system for tracking and validating all possible chess moves.
   **Solution**: Break down the move validation into separate functions for each piece type, using direction vectors to simplify the logic.

2. **Challenge**: Managing the game state reactively so the UI updates automatically.
   **Solution**: Use Vue 3's Reactivity API (reactive, ref, computed) to create a reactive game state that propagates changes to the UI.

3. **Challenge**: Implementing a clean undo/redo system.
   **Solution**: Store the complete board state after each move in a history array, allowing for easy navigation through previous positions.

4. **Challenge**: Supporting board flipping without disrupting the game logic.
   **Solution**: Keep the logical game state separate from the visual representation, applying transformations only at the UI level.

5. **Challenge**: Creating a modular system that can be extended for future features.
   **Solution**: Use composables to isolate different aspects of the game (rules, history, state) for easier maintenance and extension.

## Integration Points for Next Features

- The move generation logic is prepared for adding check/checkmate detection in Feature 9 (Game State Indicators)
- The game state management is ready for adding special moves like castling and en passant in Feature 8 (Advanced Chess Rules)
- The history tracking will support move analysis and replay functionality that will be useful for the Chess Tutor feature
- The UI components are set up for visual enhancements with animations in Feature 6
- The turn-based system sets the foundation for the AI opponent in Feature 10
- The board flipping capability will be useful for multiplayer functionality in future extensions
- The modular game state design allows for easy integration with local storage in Feature 14 (Game Saving/Loading)


        gameState.currentTurn = gameState.currentTurn === 'white' ?