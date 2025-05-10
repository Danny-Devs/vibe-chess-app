# Feature 7: Advanced Chess Rules

## Description

Implement advanced chess rules including castling, en passant, and pawn promotion to complete the core chess functionality. These special moves add strategic depth to the game and are essential for a complete chess experience. This feature will ensure that all standard chess rules are properly enforced, allowing players to use the full range of strategic options available in chess.

## Technical Implementation

### File Structure

Enhance existing files and add new ones:

```
src/
├── composables/
│   ├── useChessRules.ts          # Update with special move rules
│   ├── useGameState.ts           # Update to handle special moves
│   └── useSpecialMoves.ts        # New composable for special moves
├── components/
│   ├── Promotion/
│   │   └── PromotionDialog.vue   # Pawn promotion selection UI
│   └── Board/
│       └── ChessBoard.vue        # Update to handle special moves
└── constants/
    └── specialMovesConfig.ts     # Configuration for special moves
```

### Special Moves Configuration

Create `src/constants/specialMovesConfig.ts`:

```typescript
import type { Square } from '../types';

// Castling configuration
export const CASTLING_CONFIG = {
  // Initial positions for kings and rooks
  white: {
    king: {
      initial: 'e1',
      kingSide: 'g1',  // King's position after kingside castling
      queenSide: 'c1'  // King's position after queenside castling
    },
    rook: {
      kingSideInitial: 'h1',
      kingSideFinal: 'f1',
      queenSideInitial: 'a1',
      queenSideFinal: 'd1'
    }
  },
  black: {
    king: {
      initial: 'e8',
      kingSide: 'g8',
      queenSide: 'c8'
    },
    rook: {
      kingSideInitial: 'h8',
      kingSideFinal: 'f8',
      queenSideInitial: 'a8',
      queenSideFinal: 'd8'
    }
  },
  
  // Squares that must be empty for castling
  emptySquares: {
    whiteKingSide: ['f1', 'g1'],
    whiteQueenSide: ['b1', 'c1', 'd1'],
    blackKingSide: ['f8', 'g8'],
    blackQueenSide: ['b8', 'c8', 'd8']
  },
  
  // Squares that must not be under attack for castling
  safeSquares: {
    whiteKingSide: ['e1', 'f1', 'g1'],
    whiteQueenSide: ['e1', 'd1', 'c1'],
    blackKingSide: ['e8', 'f8', 'g8'],
    blackQueenSide: ['e8', 'd8', 'c8']
  }
};

// En passant configuration
export const EN_PASSANT_CONFIG = {
  // Ranks where pawns start and can move two squares
  startingRanks: {
    white: '2',
    black: '7'
  },
  
  // Ranks from which en passant capture can be performed
  captureRanks: {
    white: '5',
    black: '4'
  }
};

// Promotion configuration
export const PROMOTION_CONFIG = {
  // Ranks where promotion happens
  promotionRanks: {
    white: '8',
    black: '1'
  },
  
  // Available piece types for promotion
  promotionPieces: ['queen', 'rook', 'bishop', 'knight']
};
```

### Special Moves Composable

Create `src/composables/useSpecialMoves.ts`:

```typescript
import { ref, computed } from 'vue';
import type { Piece, PieceColor, Square, Move, PieceType } from '../types';
import { CASTLING_CONFIG, EN_PASSANT_CONFIG, PROMOTION_CONFIG } from '../constants/specialMovesConfig';

export function useSpecialMoves(
  pieces: Piece[],
  isSquareEmpty: (square: Square) => boolean,
  isSquareAttacked: (square: Square, by: PieceColor) => boolean,
  getKingPosition: (color: PieceColor) => Square
) {
  // Last move for en passant tracking
  const lastMove = ref<Move | null>(null);
  
  // Currently available en passant target square
  const enPassantTarget = computed<Square | null>(() => {
    if (!lastMove.value) return null;
    
    const { piece, from, to, type } = lastMove.value;
    
    // Check if the last move was a pawn moving two squares
    if (
      piece.type === 'pawn' && 
      type === 'normal' && 
      Math.abs(from.charCodeAt(1) - to.charCodeAt(1)) === 2
    ) {
      // Calculate the en passant target square (the square "behind" the pawn)
      const file = to.charAt(0);
      const rank = piece.color === 'white' ? '3' : '6';
      return `${file}${rank}` as Square;
    }
    
    return null;
  });
  
  // Update the last move
  const setLastMove = (move: Move) => {
    lastMove.value = move;
  };
  
  // Check if a king can castle (either kingside or queenside)
  const canCastle = (
    kingId: string, 
    color: PieceColor, 
    side: 'kingSide' | 'queenSide'
  ): boolean => {
    // Get the king piece
    const king = pieces.find(p => p.id === kingId);
    
    // King must exist and not have moved
    if (!king || king.hasMoved) return false;
    
    // Get the appropriate rook
    const rookInitial = CASTLING_CONFIG[color].rook[`${side}Initial`];
    const rook = pieces.find(p => p.square === rookInitial && p.type === 'rook');
    
    // Rook must exist and not have moved
    if (!rook || rook.hasMoved) return false;
    
    // Check if squares between king and rook are empty
    const emptySquares = CASTLING_CONFIG.emptySquares[`${color}${side.charAt(0).toUpperCase() + side.slice(1)}`];
    if (!emptySquares.every(square => isSquareEmpty(square as Square))) {
      return false;
    }
    
    // Check if king is in check or would pass through check
    const safeSquares = CASTLING_CONFIG.safeSquares[`${color}${side.charAt(0).toUpperCase() + side.slice(1)}`];
    const oppositeColor = color === 'white' ? 'black' : 'white';
    
    if (safeSquares.some(square => isSquareAttacked(square as Square, oppositeColor))) {
      return false;
    }
    
    return true;
  };
  
  // Generate castling moves for a king
  const generateCastlingMoves = (
    king: Piece, 
    color: PieceColor
  ): Move[] => {
    const moves: Move[] = [];
    
    // Check kingside castling
    if (canCastle(king.id, color, 'kingSide')) {
      const kingTo = CASTLING_CONFIG[color].king.kingSide;
      const rookFrom = CASTLING_CONFIG[color].rook.kingSideInitial;
      const rookTo = CASTLING_CONFIG[color].rook.kingSideFinal;
      
      moves.push({
        piece: king,
        from: king.square,
        to: kingTo as Square,
        type: 'castle',
        notation: 'O-O',
        castlingRook: pieces.find(p => p.square === rookFrom),
        castlingRookTo: rookTo as Square
      });
    }
    
    // Check queenside castling
    if (canCastle(king.id, color, 'queenSide')) {
      const kingTo = CASTLING_CONFIG[color].king.queenSide;
      const rookFrom = CASTLING_CONFIG[color].rook.queenSideInitial;
      const rookTo = CASTLING_CONFIG[color].rook.queenSideFinal;
      
      moves.push({
        piece: king,
        from: king.square,
        to: kingTo as Square,
        type: 'castle',
        notation: 'O-O-O',
        castlingRook: pieces.find(p => p.square === rookFrom),
        castlingRookTo: rookTo as Square
      });
    }
    
    return moves;
  };
  
  // Generate en passant capture moves for a pawn
  const generateEnPassantMoves = (
    pawn: Piece,
    fileIndex: number,
    rankIndex: number
  ): Move[] => {
    const moves: Move[] = [];
    
    if (!enPassantTarget.value) return moves;
    
    // Check if pawn is in the correct rank for en passant
    const captureRank = EN_PASSANT_CONFIG.captureRanks[pawn.color];
    if (pawn.square.charAt(1) !== captureRank) return moves;
    
    // Check if pawn is adjacent to the en passant target
    const targetFile = enPassantTarget.value.charAt(0);
    const pawnFile = pawn.square.charAt(0);
    
    if (Math.abs(pawnFile.charCodeAt(0) - targetFile.charCodeAt(0)) !== 1) {
      return moves;
    }
    
    // Find the pawn to be captured (it's not on the en passant target, but on the same file)
    const capturedPawnSquare = `${targetFile}${pawn.color === 'white' ? '5' : '4'}` as Square;
    const capturedPawn = pieces.find(p => p.square === capturedPawnSquare);
    
    if (!capturedPawn) return moves;
    
    // Create the en passant move
    moves.push({
      piece: pawn,
      from: pawn.square,
      to: enPassantTarget.value,
      type: 'en-passant',
      capturedPiece: capturedPawn,
      notation: `${pawn.square.charAt(0)}x${enPassantTarget.value}e.p.`
    });
    
    return moves;
  };
  
  // Check if a pawn can be promoted
  const canPromote = (pawn: Piece, targetSquare: Square): boolean => {
    const targetRank = targetSquare.charAt(1);
    const promotionRank = PROMOTION_CONFIG.promotionRanks[pawn.color];
    
    return pawn.type === 'pawn' && targetRank === promotionRank;
  };
  
  // Generate promotion moves for a pawn
  const generatePromotionMoves = (
    pawn: Piece,
    targetSquare: Square,
    moveType: 'normal' | 'capture',
    capturedPiece?: Piece
  ): Move[] => {
    const moves: Move[] = [];
    
    // Check if the pawn can be promoted
    if (!canPromote(pawn, targetSquare)) return moves;
    
    // Create a move for each possible promotion piece
    for (const promotionPiece of PROMOTION_CONFIG.promotionPieces) {
      const notation = moveType === 'normal'
        ? `${targetSquare}=${promotionPiece.charAt(0).toUpperCase()}`
        : `${pawn.square.charAt(0)}x${targetSquare}=${promotionPiece.charAt(0).toUpperCase()}`;
        
      moves.push({
        piece: pawn,
        from: pawn.square,
        to: targetSquare,
        type: 'promotion',
        promotionPiece: promotionPiece as PieceType,
        capturedPiece,
        notation
      });
    }
    
    return moves;
  };
  
  // Execute a castling move
  const executeCastling = (
    move: Move,
    updatePiecePosition: (pieceId: string, square: Square) => void
  ): void => {
    if (
      move.type !== 'castle' || 
      !move.castlingRook || 
      !move.castlingRookTo
    ) {
      return;
    }
    
    // Move the king
    updatePiecePosition(move.piece.id, move.to);
    
    // Move the rook
    updatePiecePosition(move.castlingRook.id, move.castlingRookTo);
  };
  
  // Execute an en passant capture
  const executeEnPassant = (
    move: Move,
    removePiece: (pieceId: string) => void,
    updatePiecePosition: (pieceId: string, square: Square) => void
  ): void => {
    if (move.type !== 'en-passant' || !move.capturedPiece) {
      return;
    }
    
    // Move the capturing pawn
    updatePiecePosition(move.piece.id, move.to);
    
    // Remove the captured pawn
    removePiece(move.capturedPiece.id);
  };
  
  // Execute a promotion move
  const executePromotion = (
    move: Move,
    promotePawn: (pieceId: string, to: Square, promotionPiece: PieceType) => void,
    removePiece: (pieceId: string) => void
  ): void => {
    if (move.type !== 'promotion' || !move.promotionPiece) {
      return;
    }
    
    // Remove captured piece if any
    if (move.capturedPiece) {
      removePiece(move.capturedPiece.id);
    }
    
    // Promote the pawn
    promotePawn(move.piece.id, move.to, move.promotionPiece);
  };
  
  return {
    enPassantTarget,
    setLastMove,
    canCastle,
    generateCastlingMoves,
    generateEnPassantMoves,
    canPromote,
    generatePromotionMoves,
    executeCastling,
    executeEnPassant,
    executePromotion
  };
}
```

### Update Chess Rules Composable

Enhance `src/composables/useChessRules.ts` with special moves:

```typescript
// Inside useChessRules, add:

// Import types for special moves
import { useSpecialMoves } from './useSpecialMoves';

// First, add the isSquareAttacked function:
const isSquareAttacked = (square: Square, by: PieceColor): boolean => {
  // Get all pieces of the attacking color
  const attackingPieces = pieces.filter(p => p.color === by);
  
  // Check if any piece can attack the square
  for (const piece of attackingPieces) {
    const potentialMoves = generatePieceMovesWithoutCheck(piece);
    
    // If any piece can move to the square as a capture, the square is attacked
    if (potentialMoves.some(move => move.to === square && (move.type === 'capture' || move.type === 'normal'))) {
      return true;
    }
  }
  
  return false;
};

// Helper to get king position
const getKingPosition = (color: PieceColor): Square => {
  const king = pieces.find(p => p.type === 'king' && p.color === color);
  return king ? king.square : (color === 'white' ? 'e1' : 'e8');
};

// Create a special moves composable instance
const specialMoves = useSpecialMoves(
  pieces,
  isSquareEmpty,
  isSquareAttacked,
  getKingPosition
);

// Update the generateMovesForPiece function to include special moves
const generateMovesForPiece = (piece: Piece): Move[] => {
  if (!piece) return [];
  
  const moves: Move[] = [];
  const [fileIndex, rankIndex] = squareToIndices(piece.square);
  
  switch (piece.type) {
    case 'pawn':
      generatePawnMoves(piece, fileIndex, rankIndex, moves);
      
      // Add en passant moves
      const enPassantMoves = specialMoves.generateEnPassantMoves(piece, fileIndex, rankIndex);
      moves.push(...enPassantMoves);
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
      
      // Add castling moves
      const castlingMoves = specialMoves.generateCastlingMoves(piece, piece.color);
      moves.push(...castlingMoves);
      break;
  }
  
  // Filter out moves that would result in check
  return moves.filter(move => !wouldResultInCheck(move.from, move.to, piece.color));
};

// Update the pawn move generation to include promotion
const generatePawnMoves = (piece: Piece, fileIndex: number, rankIndex: number, moves: Move[]) => {
  // Existing pawn move generation code...
  
  // For forward moves, check for promotion
  const forwardDir = DIRECTION_VECTORS.pawn[piece.color][0];
  const newFileIndex = fileIndex + forwardDir[0];
  const newRankIndex = rankIndex + forwardDir[1];
  const forwardSquare = indicesToSquare(newFileIndex, newRankIndex);
  
  if (forwardSquare && isSquareEmpty(forwardSquare)) {
    // Check for promotion
    if (specialMoves.canPromote(piece, forwardSquare)) {
      // Add promotion moves
      const promotionMoves = specialMoves.generatePromotionMoves(
        piece, 
        forwardSquare, 
        'normal'
      );
      moves.push(...promotionMoves);
    } else {
      // Regular forward move
      moves.push({
        piece,
        from: piece.square,
        to: forwardSquare,
        type: 'normal',
        notation: forwardSquare
      });
    }
    
    // Double forward move from starting position
    // ... existing code for double move
  }
  
  // For capture moves, also check for promotion
  const captureDirections = DIRECTION_VECTORS.pawn[piece.color].slice(2);
  
  for (const dir of captureDirections) {
    const captureFileIndex = fileIndex + dir[0];
    const captureRankIndex = rankIndex + dir[1];
    const captureSquare = indicesToSquare(captureFileIndex, captureRankIndex);
    
    if (captureSquare && hasEnemyPiece(captureSquare, piece.color)) {
      const capturedPiece = getPieceAtSquare(captureSquare);
      
      // Check for promotion
      if (specialMoves.canPromote(piece, captureSquare)) {
        // Add promotion + capture moves
        const promotionMoves = specialMoves.generatePromotionMoves(
          piece, 
          captureSquare, 
          'capture',
          capturedPiece
        );
        moves.push(...promotionMoves);
      } else {
        // Regular capture
        moves.push({
          piece,
          from: piece.square,
          to: captureSquare,
          type: 'capture',
          capturedPiece,
          notation: `${piece.square.charAt(0)}x${captureSquare}`
        });
      }
    }
  }
};

// Return the special moves composable
return {
  // ... existing functions
  isSquareAttacked,
  getKingPosition,
  specialMoves
};
```

### Promotion Dialog Component

Create `src/components/Promotion/PromotionDialog.vue`:

```vue
<template>
  <div class="promotion-dialog" v-if="show">
    <div class="promotion-options" :class="{ 'white': color === 'white', 'black': color === 'black' }">
      <div 
        v-for="option in promotionOptions" 
        :key="option"
        class="promotion-option"
        @click="selectOption(option)"
      >
        <svg :viewBox="viewBox" class="piece-svg">
          <use :href="`#piece-${option}`" class="piece-shape" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PieceColor, PieceType } from '../../types';
import { PROMOTION_CONFIG } from '../../constants/specialMovesConfig';

interface Props {
  show: boolean;
  color: PieceColor;
  position?: { x: number; y: number };
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  color: 'white',
  position: () => ({ x: 0, y: 0 })
});

const emit = defineEmits<{
  (e: 'select', pieceType: PieceType): void;
  (e: 'cancel'): void;
}>();

// Promotion options
const promotionOptions = computed<PieceType[]>(() => {
  return PROMOTION_CONFIG.promotionPieces as PieceType[];
});

// SVG viewBox for pieces
const viewBox = "0 0 45 45";

// Handle option selection
const selectOption = (option: PieceType) => {
  emit('select', option);
};
</script>

<style scoped>
.promotion-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.promotion-options {
  display: flex;
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.promotion-option {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  transition: background-color 0.2s;
}

.promotion-option:hover {
  background-color: rgba(100, 149, 237, 0.2);
}

.piece-svg {
  width: 100%;
  height: 100%;
}

/* White piece styling */
.white .piece-shape {
  fill: var(--white-piece-primary, #e6f0ff);
  stroke: var(--white-piece-outline, #4d94ff);
  stroke-width: 1.5;
}

/* Black piece styling */
.black .piece-shape {
  fill: var(--black-piece-primary, #1a1a2e);
  stroke: var(--black-piece-outline, #0f3460);
  stroke-width: 1.5;
}
</style>
```

### Update Game State Composable

Enhance `src/composables/useGameState.ts` to handle special moves:

```typescript
// Inside useGameState, add:

// State for promotion
const promotionState = reactive({
  show: false,
  pendingMove: null as Move | null,
  color: 'white' as PieceColor
});

// Handle castling move
const handleCastling = (move: Move) => {
  if (move.type !== 'castle' || !move.castlingRook || !move.castlingRookTo) {
    return;
  }
  
  // This updates both the king and rook positions
  chessRules.specialMoves.executeCastling(move, (pieceId, square) => {
    const pieceIndex = gameState.pieces.findIndex(p => p.id === pieceId);
    if (pieceIndex >= 0) {
      gameState.pieces[pieceIndex] = {
        ...gameState.pieces[pieceIndex],
        square,
        hasMoved: true
      };
    }
  });
  
  // Add to history
  addMove(move, [...gameState.pieces]);
  
  // Switch turns
  gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
  
  // Clear selection
  selectPiece(null);
};

// Handle en passant move
const handleEnPassant = (move: Move) => {
  if (move.type !== 'en-passant' || !move.capturedPiece) {
    return;
  }
  
  // Execute en passant capture
  chessRules.specialMoves.executeEnPassant(
    move,
    (pieceId) => {
      // Remove captured piece
      gameState.pieces = gameState.pieces.filter(p => p.id !== pieceId);
    },
    (pieceId, square) => {
      // Update moving piece
      const pieceIndex = gameState.pieces.findIndex(p => p.id === pieceId);
      if (pieceIndex >= 0) {
        gameState.pieces[pieceIndex] = {
          ...gameState.pieces[pieceIndex],
          square,
          hasMoved: true
        };
      }
    }
  );
  
  // Add to history
  addMove(move, [...gameState.pieces]);
  
  // Switch turns
  gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
  
  // Clear selection
  selectPiece(null);
};

// Handle promotion
const handlePromotion = (move: Move) => {
  if (move.type !== 'promotion') {
    return;
  }
  
  // If auto queen is enabled and no promotion piece specified, set to queen
  if (gameState.config.autoQueen && !move.promotionPiece) {
    move.promotionPiece = 'queen';
  }
  
  // If we have the promotion piece, execute immediately
  if (move.promotionPiece) {
    executePromotionMove(move);
  } else {
    // Otherwise, show promotion dialog
    promotionState.show = true;
    promotionState.pendingMove = move;
    promotionState.color = move.piece.color;
  }
};

// Execute a promotion move with the selected piece
const executePromotionMove = (move: Move) => {
  if (!move.promotionPiece) return;
  
  // Execute promotion
  chessRules.specialMoves.executePromotion(
    move,
    (pieceId, to, promotionPiece) => {
      // Update the pawn to the promoted piece
      const pieceIndex = gameState.pieces.findIndex(p => p.id === pieceId);
      if (pieceIndex >= 0) {
        gameState.pieces[pieceIndex] = {
          ...gameState.pieces[pieceIndex],
          square: to,
          type: promotionPiece,
          hasMoved: true
        };
      }
    },
    (pieceId) => {
      // Remove captured piece if any
      gameState.pieces = gameState.pieces.filter(p => p.id !== pieceId);
    }
  );
  
  // Update notation with promotion piece
  move.notation = move.notation.replace(/=[QRBN]?$/, `=${move.promotionPiece.charAt(0).toUpperCase()}`);
  
  // Add to history
  addMove(move, [...gameState.pieces]);
  
  // Switch turns
  gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
  
  // Clear selection
  selectPiece(null);
  
  // Hide promotion dialog
  promotionState.show = false;
  promotionState.pendingMove = null;
};

// Handle promotion piece selection
const selectPromotionPiece = (pieceType: PieceType) => {
  if (promotionState.pendingMove) {
    const move = {
      ...promotionState.pendingMove,
      promotionPiece: pieceType
    };
    
    executePromotionMove(move);
  }
};

// Cancel promotion
const cancelPromotion = () => {
  promotionState.show = false;
  promotionState.pendingMove = null;
  selectPiece(null);
};

// Update the executeMove function to handle special moves
const executeMove = (move: Move) => {
  // Handle special moves
  if (move.type === 'castle') {
    handleCastling(move);
    return;
  } else if (move.type === 'en-passant') {
    handleEnPassant(move);
    return;
  } else if (move.type === 'promotion') {
    handlePromotion(move);
    return;
  }
  
  // For normal/capture moves, use the existing code
  // ...existing implementation...
  
  // Update the last move for en passant tracking
  chessRules.specialMoves.setLastMove(move);
};

// Return the promotion state and functions
return {
  // ... existing
  promotionState,
  selectPromotionPiece,
  cancelPromotion
};
```

### Update ChessBoard Component

Update `src/components/Board/ChessBoard.vue` to include the promotion dialog:

```vue
<template>
  <div 
    class="chess-board-container"
    tabindex="0"
    ref="boardRef"
    @focus="handleBoardFocus"
    @blur="handleBoardBlur"
  >
    <div class="chess-board" :class="{ 'board-flipped': gameState.config.flipped }">
      <!-- Existing components... -->
      
      <!-- Promotion dialog -->
      <PromotionDialog
        :show="gameState.promotionState.show"
        :color="gameState.promotionState.color"
        @select="selectPromotionPiece"
        @cancel="cancelPromotion"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Add imports
import PromotionDialog from '../Promotion/PromotionDialog.vue';
import type { PieceType } from '../../types';

// Get promotion state and functions from game state
const { 
  gameState,
  // ... existing
  selectPromotionPiece,
  cancelPromotion
} = useGameState();

// Rest of the component remains the same...
</script>
```

## Dependencies

- Vue 3 with Composition API
- TypeScript
- GSAP (for animations)

## Acceptance Criteria

1. Players can perform kingside and queenside castling when legal
2. Castling is prevented when the king has moved, the rook has moved, or there are pieces between them
3. Castling is prevented when the king is in check, would move through check, or would end up in check
4. Pawns can execute en passant captures when appropriate
5. En passant is only available on the move immediately following an opponent's double pawn advance
6. Pawns are automatically promoted when they reach the opposite end of the board
7. Players can choose which piece type to promote a pawn to (queen, rook, bishop, or knight)
8. Auto-queen promotion can be toggled in settings
9. Special moves have appropriate animations consistent with the game's visual style
10. The move history correctly records special moves using standard chess notation
11. All special moves work correctly when the board is flipped

## Unit Tests

Create a file `src/composables/__tests__/useSpecialMoves.spec.ts` with the following tests:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpecialMoves } from '../useSpecialMoves';
import type { Piece, Square, Move } from '../../types';
import { CASTLING_CONFIG } from '../../constants/specialMovesConfig';

describe('useSpecialMoves', () => {
  // Mock functions and pieces
  const mockIsSquareEmpty = vi.fn();
  const mockIsSquareAttacked = vi.fn();
  const mockGetKingPosition = vi.fn();
  
  const whiteKing: Piece = {
    id: 'wk',
    type: 'king',
    color: 'white',
    square: 'e1',
    hasMoved: false
  };
  
  const whiteKingSideRook: Piece = {
    id: 'wr2',
    type: 'rook',
    color: 'white',
    square: 'h1',
    hasMoved: false
  };
  
  const whiteQueenSideRook: Piece = {
    id: 'wr1',
    type: 'rook',
    color: 'white',
    square: 'a1',
    hasMoved: false
  };
  
  const mockPieces: Piece[] = [
    whiteKing,
    whiteKingSideRook,
    whiteQueenSideRook,
    // Other pieces...
  ];
  
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mocks that allow castling
    mockIsSquareEmpty.mockImplementation(() => true);
    mockIsSquareAttacked.mockImplementation(() => false);
    mockGetKingPosition.mockImplementation((color) => color === 'white' ? 'e1' : 'e8');
  });
  
  it('detects when castling is possible', () => {
    const { canCastle } = useSpecialMoves(
      mockPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    const kingId = 'wk';
    const color = 'white';
    
    expect(canCastle(kingId, color, 'kingSide')).toBe(true);
    expect(canCastle(kingId, color, 'queenSide')).toBe(true);
  });
  
  it('prevents castling when king has moved', () => {
    const movedKingPieces = [...mockPieces];
    const kingIndex = movedKingPieces.findIndex(p => p.id === 'wk');
    movedKingPieces[kingIndex] = {
      ...movedKingPieces[kingIndex],
      hasMoved: true
    };
    
    const { canCastle } = useSpecialMoves(
      movedKingPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    expect(canCastle('wk', 'white', 'kingSide')).toBe(false);
    expect(canCastle('wk', 'white', 'queenSide')).toBe(false);
  });
  
  it('prevents castling when rook has moved', () => {
    const movedRookPieces = [...mockPieces];
    const rookIndex = movedRookPieces.findIndex(p => p.id === 'wr2');
    movedRookPieces[rookIndex] = {
      ...movedRookPieces[rookIndex],
      hasMoved: true
    };
    
    const { canCastle } = useSpecialMoves(
      movedRookPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    expect(canCastle('wk', 'white', 'kingSide')).toBe(false);
    expect(canCastle('wk', 'white', 'queenSide')).toBe(true);
  });
  
  it('prevents castling when squares between are not empty', () => {
    // Mock that f1 is not empty (blocking kingside castling)
    mockIsSquareEmpty.mockImplementation((square: Square) => {
      return square !== 'f1';
    });
    
    const { canCastle } = useSpecialMoves(
      mockPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    expect(canCastle('wk', 'white', 'kingSide')).toBe(false);
    expect(canCastle('wk', 'white', 'queenSide')).toBe(true);
  });
  
  it('prevents castling when king is in check', () => {
    // Mock that e1 is under attack
    mockIsSquareAttacked.mockImplementation((square: Square) => {
      return square === 'e1';
    });
    
    const { canCastle } = useSpecialMoves(
      mockPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    expect(canCastle('wk', 'white', 'kingSide')).toBe(false);
    expect(canCastle('wk', 'white', 'queenSide')).toBe(false);
  });
  
  it('prevents castling when king would move through check', () => {
    // Mock that f1 is under attack
    mockIsSquareAttacked.mockImplementation((square: Square) => {
      return square === 'f1';
    });
    
    const { canCastle } = useSpecialMoves(
      mockPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    expect(canCastle('wk', 'white', 'kingSide')).toBe(false);
    expect(canCastle('wk', 'white', 'queenSide')).toBe(true);
  });
  
  it('generates correct castling moves', () => {
    const { generateCastlingMoves } = useSpecialMoves(
      mockPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    const moves = generateCastlingMoves(whiteKing, 'white');
    
    expect(moves.length).toBe(2); // Both kingside and queenside
    
    const kingsideMove = moves.find(m => m.to === 'g1');
    expect(kingsideMove).toBeDefined();
    expect(kingsideMove?.type).toBe('castle');
    expect(kingsideMove?.notation).toBe('O-O');
    expect(kingsideMove?.castlingRook).toBe(whiteKingSideRook);
    expect(kingsideMove?.castlingRookTo).toBe('f1');
    
    const queensideMove = moves.find(m => m.to === 'c1');
    expect(queensideMove).toBeDefined();
    expect(queensideMove?.type).toBe('castle');
    expect(queensideMove?.notation).toBe('O-O-O');
    expect(queensideMove?.castlingRook).toBe(whiteQueenSideRook);
    expect(queensideMove?.castlingRookTo).toBe('d1');
  });
  
  it('tracks the last move for en passant', () => {
    const { enPassantTarget, setLastMove } = useSpecialMoves(
      mockPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    // Initially, no en passant target
    expect(enPassantTarget.value).toBeNull();
    
    // Set a pawn double move
    const doublePawnMove: Move = {
      piece: {
        id: 'wp1',
        type: 'pawn',
        color: 'white',
        square: 'a2'
      },
      from: 'a2',
      to: 'a4',
      type: 'normal',
      notation: 'a4'
    };
    
    setLastMove(doublePawnMove);
    expect(enPassantTarget.value).toBe('a3');
    
    // Set a different move (not a double pawn move)
    const otherMove: Move = {
      piece: {
        id: 'wn1',
        type: 'knight',
        color: 'white',
        square: 'b1'
      },
      from: 'b1',
      to: 'c3',
      type: 'normal',
      notation: 'Nc3'
    };
    
    setLastMove(otherMove);
    expect(enPassantTarget.value).toBeNull();
  });
  
  it('generates en passant capture moves', () => {
    const { generateEnPassantMoves, setLastMove } = useSpecialMoves(
      [
        ...mockPieces,
        {
          id: 'bp2',
          type: 'pawn',
          color: 'black',
          square: 'e4',
          hasMoved: true
        },
        {
          id: 'wp5',
          type: 'pawn',
          color: 'white',
          square: 'd4',
          hasMoved: true
        }
      ],
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    // Set up en passant scenario
    const doublePawnMove: Move = {
      piece: {
        id: 'bp2',
        type: 'pawn',
        color: 'black',
        square: 'e7'
      },
      from: 'e7',
      to: 'e5',
      type: 'normal',
      notation: 'e5'
    };
    
    setLastMove(doublePawnMove);
    
    // Generate en passant move for white pawn at d4
    const whitePawn = {
      id: 'wp5',
      type: 'pawn',
      color: 'white',
      square: 'd4'
    };
    
    const moves = generateEnPassantMoves(whitePawn, 3, 4); // d4 coordinates
    
    expect(moves.length).toBe(1);
    expect(moves[0].type).toBe('en-passant');
    expect(moves[0].to).toBe('e3');
    expect(moves[0].capturedPiece?.id).toBe('bp2');
  });
  
  it('checks for pawn promotion', () => {
    const { canPromote, generatePromotionMoves } = useSpecialMoves(
      mockPieces,
      mockIsSquareEmpty,
      mockIsSquareAttacked,
      mockGetKingPosition
    );
    
    const whitePawn = {
      id: 'wp1',
      type: 'pawn',
      color: 'white',
      square: 'a7'
    };
    
    expect(canPromote(whitePawn, 'a8')).toBe(true);
    expect(canPromote(whitePawn, 'a7')).toBe(false);
    
    const blackPawn = {
      id: 'bp1',
      type: 'pawn',
      color: 'black',
      square: 'a2'
    };
    
    expect(canPromote(blackPawn, 'a1')).toBe(true);
    expect(canPromote(blackPawn, 'a2')).toBe(false);
    
    // Generate promotion moves
    const moves = generatePromotionMoves(whitePawn, 'a8', 'normal');
    expect(moves.length).toBe(4); // Queen, rook, bishop, knight
    
    // Check the queen promotion
    const queenPromotion = moves.find(m => m.promotionPiece === 'queen');
    expect(queenPromotion).toBeDefined();
    expect(queenPromotion?.type).toBe('promotion');
    expect(queenPromotion?.notation).toContain('=Q');
  });
});
```

Create another file `src/composables/__tests__/useAdvancedChessRules.spec.ts` with integration tests:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameState } from '../useGameState';
import { CASTLING_CONFIG } from '../../constants/specialMovesConfig';

// Mock the GSAP animations
vi.mock('gsap', () => ({
  default: {
    to: vi.fn(() => ({ kill: vi.fn() })),
    timeline: vi.fn(() => ({ 
      to: vi.fn(() => ({ kill: vi.fn() })),
      add: vi.fn(() => ({ kill: vi.fn() })),
      clear: vi.fn()
    })),
    killTweensOf: vi.fn()
  }
}));

describe('Advanced Chess Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('performs castling correctly', () => {
    const { gameState, startNewGame, movePiece } = useGameState();
    
    startNewGame();
    
    // Setup for kingside castling
    // Clear pieces between king and rook
    const setupMoves = [
      ['e2', 'e4'], // White pawn
      ['e7', 'e5'], // Black pawn
      ['g1', 'f3'], // White knight
      ['g8', 'f6'], // Black knight
      ['f1', 'e2'], // White bishop
      ['f8', 'e7'], // Black bishop
    ];
    
    // Execute setup moves
    setupMoves.forEach(([from, to]) => {
      movePiece(from, to);
    });
    
    // Now white can castle kingside
    const result = movePiece('e1', 'g1');
    
    expect(result).toBe(true);
    expect(gameState.currentTurn).toBe('black');
    
    // Verify king position
    const whiteKing = gameState.pieces.find(p => p.id === 'wk');
    expect(whiteKing?.square).toBe('g1');
    
    // Verify rook position
    const whiteRook = gameState.pieces.find(p => p.square === 'f1');
    expect(whiteRook).toBeDefined();
    expect(whiteRook?.type).toBe('rook');
    
    // Verify notation
    const lastMove = gameState.history.moves[gameState.history.moves.length - 1];
    expect(lastMove.notation).toBe('O-O');
  });
  
  it('performs en passant capture correctly', () => {
    const { gameState, startNewGame, movePiece } = useGameState();
    
    startNewGame();
    
    // Setup for en passant
    const setupMoves = [
      ['e2', 'e4'], // White pawn
      ['a7', 'a6'], // Black pawn (not relevant)
      ['e4', 'e5'], // White pawn
      ['d7', 'd5'], // Black pawn double move - creates en passant opportunity
    ];
    
    // Execute setup moves
    setupMoves.forEach(([from, to]) => {
      movePiece(from, to);
    });
    
    // White captures en passant
    const result = movePiece('e5', 'd6');
    
    expect(result).toBe(true);
    expect(gameState.currentTurn).toBe('black');
    
    // Verify capturing pawn position
    const whitePawn = gameState.pieces.find(p => p.square === 'd6');
    expect(whitePawn).toBeDefined();
    expect(whitePawn?.type).toBe('pawn');
    
    // Verify captured pawn is removed
    const blackPawn = gameState.pieces.find(p => p.id === 'bp4'); // d7 pawn
    expect(blackPawn).toBeUndefined();
    
    // Verify notation
    const lastMove = gameState.history.moves[gameState.history.moves.length - 1];
    expect(lastMove.type).toBe('en-passant');
  });
  
  it('handles pawn promotion correctly', () => {
    const { gameState, startNewGame, movePiece, selectPromotionPiece } = useGameState();
    
    startNewGame();
    
    // Replace pieces to set up a promotion scenario
    gameState.pieces = gameState.pieces.filter(p => 
      !(p.square === 'a7' || p.square === 'a8' || p.type === 'queen')
    );
    
    // Add white pawn at a7
    gameState.pieces.push({
      id: 'wp1',
      type: 'pawn',
      color: 'white',
      square: 'a7',
      hasMoved: true
    });
    
    // White promotes pawn
    movePiece('a7', 'a8');
    
    // Verify promotion dialog shows
    expect(gameState.promotionState.show).toBe(true);
    
    // Select queen
    selectPromotionPiece('queen');
    
    // Verify pawn was promoted
    const promotedPiece = gameState.pieces.find(p => p.id === 'wp1');
    expect(promotedPiece).toBeDefined();
    expect(promotedPiece?.type).toBe('queen');
    expect(promotedPiece?.square).toBe('a8');
    
    // Verify notation
    const lastMove = gameState.history.moves[gameState.history.moves.length - 1];
    expect(lastMove.type).toBe('promotion');
    expect(lastMove.notation).toContain('=Q');
  });
  
  it('auto-promotes to queen when enabled', () => {
    const { gameState, startNewGame, movePiece } = useGameState();
    
    startNewGame();
    
    // Enable auto-queen
    gameState.config.autoQueen = true;
    
    // Replace pieces to set up a promotion scenario
    gameState.pieces = gameState.pieces.filter(p => 
      !(p.square === 'a7' || p.square === 'a8' || p.type === 'queen')
    );
    
    // Add white pawn at a7
    gameState.pieces.push({
      id: 'wp1',
      type: 'pawn',
      color: 'white',
      square: 'a7',
      hasMoved: true
    });
    
    // White promotes pawn
    movePiece('a7', 'a8');
    
    // Verify promotion dialog does not show
    expect(gameState.promotionState.show).toBe(false);
    
    // Verify auto-promotion to queen
    const promotedPiece = gameState.pieces.find(p => p.id === 'wp1');
    expect(promotedPiece?.type).toBe('queen');
  });
});
```

## Challenges & Solutions

1. **Challenge**: Ensuring castling rules are correctly implemented with all the required conditions.
   **Solution**: Create a detailed validation system that checks for king and rook movement history, intervening pieces, and squares under attack.

2. **Challenge**: Implementing en passant with correct timing (only available immediately after a double pawn move).
   **Solution**: Track the last move in the game state and compute the en passant target square dynamically.

3. **Challenge**: Designing a user-friendly pawn promotion interface that doesn't disrupt the game flow.
   **Solution**: Create a modal dialog that appears when a pawn reaches the promotion rank, with clear piece options and an auto-queen setting.

4. **Challenge**: Handling the special case of castling where two pieces move in a single turn.
   **Solution**: Extend the move execution system to handle castling as a special case, updating both the king and rook positions.

5. **Challenge**: Ensuring correct animation for special moves, especially castling where two pieces move.
   **Solution**: Create a sequence-based animation system that can handle multiple piece movements in the correct order.

6. **Challenge**: Maintaining correct game history and notation for special moves.
   **Solution**: Implement standard chess notation for special moves (O-O, O-O-O, e.p., =Q) and ensure the game history correctly records all move details.

7. **Challenge**: Testing all the edge cases and conditions for special moves.
   **Solution**: Create comprehensive unit tests that verify all special move conditions and their interactions with the rest of the game rules.

## Integration Points for Next Features

- The special moves system completes the core chess rules, setting the foundation for the game state indicators in Feature 8
- The castling validation includes check detection that will be expanded in Feature 8 for checkmate and stalemate detection
- The promotion UI can be styled consistently with the animation system from Feature 6
- The en passant implementation tracks move history which will be useful for the game replay feature in later implementations
- The special moves will be respected by the AI opponent in Feature 10
- The notation for special moves will be used in the chess tutor feature to explain strategic concepts
- The advanced rules provide greater depth for the move suggestions in Feature 13
