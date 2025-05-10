# Feature 2: Chess Pieces

## Description

Create SVG chess pieces with a digital wireframe aesthetic combined with sacred geometry patterns. These pieces will be positioned on the chessboard and serve as the visual representation of the game pieces. Each piece type (pawn, rook, knight, bishop, queen, king) will have a distinct design that is easily recognizable while maintaining a cohesive visual style across the set.

## Technical Implementation

### File Structure

Add the following files to the project:

```
src/
├── components/
│   ├── Pieces/
│   │   ├── ChessPiece.vue        # Wrapper component for all pieces
│   │   ├── PieceDefinitions.vue  # SVG definitions for all pieces
│   │   └── index.ts
├── composables/
│   └── usePieces.ts              # Composable for piece management
├── constants/
│   ├── boardConfig.ts            # (existing)
│   └── pieceConfig.ts            # New constants for pieces
└── types/
    └── index.ts                  # Update types file
```

### Updated Types

Update `src/types/index.ts` with the following additions:

```typescript
// Existing types...

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
  square: Square;
  hasMoved?: boolean;
}

export interface GameState {
  pieces: Piece[];
  currentTurn: PieceColor;
  selectedPieceId: string | null;
}
```

### Constants for Pieces

Create `src/constants/pieceConfig.ts`:

```typescript
import type { PieceType, PieceColor, Piece, Square } from '../types';

// Golden ratio for sacred geometry proportions
export const GOLDEN_RATIO = 1.618;

// Colors for the wireframe effect
export const PIECE_COLORS = {
  white: {
    primary: '#e6f0ff',
    secondary: '#99c2ff',
    outline: '#4d94ff',
    glow: 'rgba(77, 148, 255, 0.5)'
  },
  black: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    outline: '#0f3460',
    glow: 'rgba(15, 52, 96, 0.5)'
  }
};

// Size constants for pieces
export const PIECE_SCALE = 0.85; // Pieces take up 85% of square size

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
  { id: 'bp8', type: 'pawn', color: 'black', square: 'h7', hasMoved: false }
];
```

### Piece Management Composable

Create `src/composables/usePieces.ts`:

```typescript
import { ref, computed } from 'vue';
import type { Piece, Square, PieceColor, PieceType } from '../types';
import { INITIAL_POSITION } from '../constants/pieceConfig';
import { useBoardUtils } from './useBoardUtils';

export function usePieces() {
  const { squareToCoordinates } = useBoardUtils();
  const pieces = ref<Piece[]>([...INITIAL_POSITION]);
  
  // Find a piece at a specific square
  const getPieceAtSquare = (square: Square): Piece | undefined => {
    return pieces.value.find(piece => piece.square === square);
  };
  
  // Get all pieces of a specific color
  const getPiecesByColor = (color: PieceColor) => {
    return computed(() => pieces.value.filter(piece => piece.color === color));
  };
  
  // Get piece by ID
  const getPieceById = (id: string): Piece | undefined => {
    return pieces.value.find(piece => piece.id === id);
  };
  
  // Move a piece to a new square
  const movePiece = (pieceId: string, targetSquare: Square) => {
    const pieceIndex = pieces.value.findIndex(p => p.id === pieceId);
    if (pieceIndex >= 0) {
      // Create a new array with the updated piece
      pieces.value = pieces.value.map((p, index) => {
        if (index === pieceIndex) {
          return { ...p, square: targetSquare, hasMoved: true };
        }
        return p;
      });
    }
  };
  
  // Remove a piece from the board (when captured)
  const removePiece = (pieceId: string) => {
    pieces.value = pieces.value.filter(p => p.id !== pieceId);
  };
  
  // Reset pieces to initial position
  const resetPieces = () => {
    pieces.value = [...INITIAL_POSITION];
  };
  
  return {
    pieces,
    getPieceAtSquare,
    getPiecesByColor,
    getPieceById,
    movePiece,
    removePiece,
    resetPieces
  };
}
```

### SVG Piece Definitions

Create `src/components/Pieces/PieceDefinitions.vue`:

```vue
<template>
  <svg style="position: absolute; width: 0; height: 0;" width="0" height="0" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Pawn -->
      <g id="piece-pawn">
        <path d="M22,9 A7,7 0 0,1 8,9 A7,7 0 0,1 22,9 Z" />
        <path d="M15,30 C15,30 22,21 22,9 A7,7 0 0,0 8,9 C8,21 15,30 15,30 Z" />
        <path d="M5,34 L25,34 L25,36 L5,36 Z" />
        <ellipse cx="15" cy="35" rx="10" ry="2" />

        <!-- Sacred geometry pattern - Seed of life -->
        <circle class="sacred-geometry" cx="15" cy="14" r="2.5" />
        <circle class="sacred-geometry" cx="15" cy="11.5" r="2.5" />
        <circle class="sacred-geometry" cx="17.2" cy="12.5" r="2.5" />
        <circle class="sacred-geometry" cx="12.8" cy="12.5" r="2.5" />
      </g>

      <!-- Rook -->
      <g id="piece-rook">
        <path d="M9,36 L11,36 L11,32 L9,32 L9,36 Z" />
        <path d="M12,36 L14,36 L14,32 L12,32 L12,36 Z" />
        <path d="M15,36 L17,36 L17,32 L15,32 L15,36 Z" />
        <path d="M18,36 L20,36 L20,32 L18,32 L18,36 Z" />
        <path d="M21,36 L23,36 L23,32 L21,32 L21,36 Z" />
        <rect x="8" y="30" width="18" height="2" />
        <path d="M8,11 L8,8 L26,8 L26,11" />
        <path d="M8,11 L8,30 L26,30 L26,11" />
        <path d="M9,8 L9,2 L11,2 L11,5 L14,5 L14,2 L20,2 L20,5 L23,5 L23,2 L25,2 L25,8" />
        
        <!-- Sacred geometry pattern - Square grid overlay -->
        <rect class="sacred-geometry" x="12" y="12" width="10" height="10" stroke-width="0.5" fill="none" />
        <line class="sacred-geometry" x1="12" y1="17" x2="22" y2="17" stroke-width="0.5" />
        <line class="sacred-geometry" x1="17" y1="12" x2="17" y2="22" stroke-width="0.5" />
      </g>

      <!-- Knight -->
      <g id="piece-knight">
        <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
        <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" />
        <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" />
        
        <!-- Sacred geometry pattern - Fibonacci spiral -->
        <path class="sacred-geometry" d="M18,25 a4,4 0 0,1 -4,4 a4,4 0 0,1 -4,-4 a4,4 0 0,1 4,-4" fill="none" stroke-width="0.5" />
        <path class="sacred-geometry" d="M14,21 a2.5,2.5 0 0,1 2.5,2.5" fill="none" stroke-width="0.5" />
        <path class="sacred-geometry" d="M16.5,23.5 a1.5,1.5 0 0,1 -1.5,1.5" fill="none" stroke-width="0.5" />
      </g>

      <!-- Bishop -->
      <g id="piece-bishop">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
        <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
        
        <!-- Sacred geometry pattern - Vesica Piscis -->
        <circle class="sacred-geometry" cx="19.5" cy="18" r="5" fill="none" stroke-width="0.5" />
        <circle class="sacred-geometry" cx="25.5" cy="18" r="5" fill="none" stroke-width="0.5" />
      </g>

      <!-- Queen -->
      <g id="piece-queen">
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" />
        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
        <path d="M 11.5,30 C 15,29 30,29 33.5,30" />
        <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" />
        
        <!-- Sacred geometry pattern - Flower of Life -->
        <circle class="sacred-geometry" cx="22.5" cy="20" r="3" fill="none" stroke-width="0.5" />
        <circle class="sacred-geometry" cx="19" cy="18" r="3" fill="none" stroke-width="0.5" />
        <circle class="sacred-geometry" cx="26" cy="18" r="3" fill="none" stroke-width="0.5" />
        <circle class="sacred-geometry" cx="19" cy="22" r="3" fill="none" stroke-width="0.5" />
        <circle class="sacred-geometry" cx="26" cy="22" r="3" fill="none" stroke-width="0.5" />
      </g>

      <!-- King -->
      <g id="piece-king">
        <path d="M 22.5,11.63 L 22.5,6" style="stroke-linecap:butt;" />
        <path d="M 20,8 L 25,8" style="stroke-linecap:butt;" />
        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
        <path d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37" />
        <path d="M 12.5,30 C 18,27 27,27 32.5,30" />
        <path d="M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5" />
        <path d="M 12.5,37 C 18,34 27,34 32.5,37" />
        
        <!-- Sacred geometry pattern - Metatron's Cube -->
        <circle class="sacred-geometry" cx="22.5" cy="22" r="8" fill="none" stroke-width="0.5" />
        <path class="sacred-geometry" d="M22.5,14 L22.5,30 M17.5,16 L27.5,28 M17.5,28 L27.5,16 M14.5,22 L30.5,22" stroke-width="0.5" fill="none" />
      </g>
    </defs>
  </svg>
</template>

<script setup lang="ts">
// No script content needed for SVG definitions
</script>

<style scoped>
/* Styling for piece SVG elements */
.sacred-geometry {
  stroke: currentColor;
  opacity: 0.3;
}
</style>
```

### Chess Piece Component

Create `src/components/Pieces/ChessPiece.vue`:

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
.chess-piece {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  top: 0;
  left: 0;
  width: 12.5%;
  height: 12.5%;
  z-index: 10;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform;
  pointer-events: all;
}

.piece-svg {
  width: 100%;
  height: 100%;
}

/* Digital wireframe styling for pieces */
.piece-white .piece-shape {
  fill: var(--white-piece-primary, #e6f0ff);
  stroke: var(--white-piece-outline, #4d94ff);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 3px var(--white-piece-glow, rgba(77, 148, 255, 0.5)));
}

.piece-black .piece-shape {
  fill: var(--black-piece-primary, #1a1a2e);
  stroke: var(--black-piece-outline, #0f3460);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 3px var(--black-piece-glow, rgba(15, 52, 96, 0.5)));
}

/* Selected piece styling */
.selected {
  z-index: 20;
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.8));
  transform: scale(1.1);
}

.selected .piece-shape {
  stroke-width: 2;
}

/* White pieces sacred geometry patterns */
.piece-white .sacred-geometry {
  stroke: var(--white-piece-secondary, #99c2ff);
  opacity: 0.4;
}

/* Black pieces sacred geometry patterns */
.piece-black .sacred-geometry {
  stroke: var(--black-piece-secondary, #16213e);
  opacity: 0.4;
}

/* Extra digital wireframe glow effect on hover */
.chess-piece:hover {
  filter: drop-shadow(0 0 8px rgba(100, 149, 237, 0.7));
  z-index: 25;
}
</style>
```

### Update the ChessBoard Component

Update `src/components/Board/ChessBoard.vue` to include and position the chess pieces:

```vue
<template>
  <div class="chess-board-container">
    <div class="chess-board">
      <!-- Board squares -->
      <ChessSquare
        v-for="square in boardSquares"
        :key="square"
        :square="square"
        :color="getSquareColor(square[0], square[1])"
        :showCoordinates="showCoordinates"
      />
      
      <!-- Chess pieces -->
      <div class="pieces-container">
        <ChessPiece
          v-for="piece in pieces"
          :key="piece.id"
          :piece="piece"
          :isSelected="piece.id === selectedPieceId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ChessSquare from '../Square/ChessSquare.vue';
import ChessPiece from '../Pieces/ChessPiece.vue';
import PieceDefinitions from '../Pieces/PieceDefinitions.vue';
import { useBoardUtils } from '../../composables/useBoardUtils';
import { usePieces } from '../../composables/usePieces';

interface Props {
  showCoordinates?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true
});

const { getSquareColor, generateBoardSquares } = useBoardUtils();
const boardSquares = generateBoardSquares;

// Get the pieces for the board
const { pieces } = usePieces();
const selectedPieceId = ref<string | null>(null);

// To be used in future features
const selectPiece = (pieceId: string) => {
  selectedPieceId.value = pieceId;
};

const clearSelection = () => {
  selectedPieceId.value = null;
};
</script>

<style scoped>
/* Existing CSS... */

.pieces-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* CSS Variables for pieces */
:root {
  /* Existing variables... */
  
  /* White pieces */
  --white-piece-primary: #e6f0ff;
  --white-piece-secondary: #99c2ff;
  --white-piece-outline: #4d94ff;
  --white-piece-glow: rgba(77, 148, 255, 0.5);
  
  /* Black pieces */
  --black-piece-primary: #1a1a2e;
  --black-piece-secondary: #16213e;
  --black-piece-outline: #0f3460;
  --black-piece-glow: rgba(15, 52, 96, 0.5);
}
</style>
```

### Update App.vue

Update `src/App.vue` to include the PieceDefinitions component:

```vue
<template>
  <div class="app">
    <header class="header">
      <h1>Sacred Geometry Chess</h1>
    </header>
    
    <main class="main-content">
      <ChessBoard />
    </main>
    
    <footer class="footer">
      <p>Digital Wireframe Chess - Version 0.1</p>
    </footer>
    
    <!-- SVG Definitions for chess pieces -->
    <PieceDefinitions />
  </div>
</template>

<script setup lang="ts">
import ChessBoard from './components/Board/ChessBoard.vue';
import PieceDefinitions from './components/Pieces/PieceDefinitions.vue';
</script>

<!-- Existing styles... -->
```

## Dependencies

- Vue 3 with Composition API
- TypeScript
- GSAP (for future animations)

## Acceptance Criteria

1. All six chess piece types (pawn, rook, knight, bishop, queen, king) are rendered as SVG with a digital wireframe aesthetic
2. Each piece incorporates sacred geometry patterns that are subtle but visible
3. Pieces are correctly positioned on the board based on standard chess starting positions
4. Pieces visually distinguish between white and black
5. Pieces have a cohesive design language that makes them look like a set
6. Pieces have subtle visual effects (glow, highlights) consistent with the wireframe aesthetic
7. The pieces scale appropriately with the board
8. Pieces are structured in a way that will support animation in future features

## Unit Tests

Create a file `src/components/Pieces/__tests__/ChessPiece.spec.ts` with the following tests:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChessPiece from '../ChessPiece.vue';
import type { Piece } from '../../../types';

describe('ChessPiece', () => {
  it('renders the correct piece type and color', () => {
    const piece: Piece = {
      id: 'wk',
      type: 'king',
      color: 'white',
      square: 'e1'
    };
    
    const wrapper = mount(ChessPiece, {
      props: {
        piece
      },
      global: {
        stubs: {
          // Stub the SVG reference since it relies on external SVG definitions
          svg: true
        }
      }
    });
    
    expect(wrapper.classes()).toContain('piece-king');
    expect(wrapper.classes()).toContain('piece-white');
  });
  
  it('applies selected class when isSelected is true', () => {
    const piece: Piece = {
      id: 'wk',
      type: 'king',
      color: 'white',
      square: 'e1'
    };
    
    const wrapper = mount(ChessPiece, {
      props: {
        piece,
        isSelected: true
      },
      global: {
        stubs: {
          svg: true
        }
      }
    });
    
    expect(wrapper.classes()).toContain('selected');
  });
  
  it('sets the correct data-piece-id attribute', () => {
    const piece: Piece = {
      id: 'wk',
      type: 'king',
      color: 'white',
      square: 'e1'
    };
    
    const wrapper = mount(ChessPiece, {
      props: {
        piece
      },
      global: {
        stubs: {
          svg: true
        }
      }
    });
    
    expect(wrapper.attributes('data-piece-id')).toBe('wk');
  });
  
  it('calculates the correct position based on square', () => {
    const piece: Piece = {
      id: 'wk',
      type: 'king',
      color: 'white',
      square: 'e1'
    };
    
    const wrapper = mount(ChessPiece, {
      props: {
        piece
      },
      global: {
        stubs: {
          svg: true
        }
      }
    });
    
    // e1 should translate to specific coordinates
    // This depends on the exact implementation of squareToCoordinates
    const style = wrapper.attributes('style');
    expect(style).toContain('transform');
  });
});
```

## Challenges & Solutions

1. **Challenge**: Creating visually distinct pieces that still maintain a cohesive style.
   **Solution**: Use the same stroke style and effects for all pieces, while varying the base shapes. Incorporate sacred geometry patterns unique to each piece type but with consistent rendering.

2. **Challenge**: Balancing the visual complexity of sacred geometry with the need for clarity.
   **Solution**: Keep the sacred geometry patterns subtle with reduced opacity, ensuring they enhance rather than overwhelm the piece designs.

3. **Challenge**: Setting up SVG definitions that can be reused efficiently.
   **Solution**: Use a single PieceDefinitions component with all SVG definitions, then reference them with `<use>` tags in each ChessPiece component.

4. **Challenge**: Positioning pieces correctly on the board.
   **Solution**: Leverage the squareToCoordinates utility to calculate the correct position for each piece based on its current square.

5. **Challenge**: Creating a wireframe glow effect that looks good on both white and black pieces.
   **Solution**: Use CSS variables to define colors and filter effects that can be customized per piece color.

## Integration Points for Next Features

- The ChessPiece component has been designed to accept an `isSelected` prop that will be used in the move validation feature
- The pieces array is managed by the usePieces composable, which will be extended for game state management
- The SVG structure is set up to allow for animations and transitions when pieces move
- CSS is organized to make it easy to add animation effects in future features
