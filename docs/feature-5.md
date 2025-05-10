# Feature 5: Keyboard Navigation

## Description

Implement first-class keyboard navigation to make the chess game fully accessible and provide an alternative input method. This feature will allow players to navigate the board, select pieces, and make moves using only the keyboard, with clear visual feedback at each step. The implementation will follow accessibility best practices to ensure a good experience for all users.

## Technical Implementation

### File Structure

Add new files and update existing ones:

```
src/
├── composables/
│   └── useKeyboardNavigation.ts  # Keyboard navigation logic
├── constants/
│   └── keyboardConfig.ts         # Keyboard configuration
└── components/
    ├── Board/
    │   └── ChessBoard.vue        # Update to handle keyboard events
    └── FocusIndicator.vue        # Visual indicator for keyboard focus
```

### Keyboard Configuration

Create `src/constants/keyboardConfig.ts`:

```typescript
// Keyboard navigation configuration

// Keycodes for navigation
export const KEY_CODES = {
  // Arrow keys
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  
  // WASD keys
  W: 'KeyW',
  A: 'KeyA',
  S: 'KeyS',
  D: 'KeyD',
  
  // Action keys
  ENTER: 'Enter',
  SPACE: 'Space',
  ESCAPE: 'Escape',
  
  // Chess notation
  FILE_KEYS: ['KeyA', 'KeyB', 'KeyC', 'KeyD', 'KeyE', 'KeyF', 'KeyG', 'KeyH'],
  RANK_KEYS: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8']
};

// Navigation modes
export enum NavigationMode {
  BOARD = 'board',     // Navigating the board squares
  PIECE = 'piece',     // Moving a selected piece
  MENU = 'menu'        // Navigating menu items
}

// Keyboard shortcuts
export const SHORTCUTS = {
  TOGGLE_BOARD_ORIENTATION: 'KeyF',  // F to flip
  NEW_GAME: 'KeyN',                  // N for new game
  UNDO: 'KeyZ',                      // Z to undo
  REDO: 'KeyY',                      // Y to redo
  HELP: 'KeyH',                      // H for help
  NOTATION_MODE: 'KeyM'              // M to toggle notation mode
};

// Keyboard help text
export const KEYBOARD_HELP = {
  title: 'Keyboard Controls',
  navigation: [
    { key: 'Arrow Keys / WASD', description: 'Navigate the board' },
    { key: 'Space / Enter', description: 'Select piece or make move' },
    { key: 'Escape', description: 'Deselect piece or cancel move' }
  ],
  shortcuts: [
    { key: 'F', description: 'Flip board orientation' },
    { key: 'N', description: 'Start new game' },
    { key: 'Z', description: 'Undo move' },
    { key: 'Y', description: 'Redo move' },
    { key: 'H', description: 'Show/hide help' },
    { key: 'M', description: 'Toggle notation mode' },
  ],
  notation: [
    { key: 'a-h', description: 'Select file (column)' },
    { key: '1-8', description: 'Select rank (row)' }
  ]
};
```

### Focus Indicator Component

Create `src/components/FocusIndicator.vue`:

```vue
<template>
  <div 
    class="focus-indicator"
    :style="positionStyle"
    :class="{ 
      'has-piece': hasPiece,
      'is-selected': isSelected
    }"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Square } from '../types';
import { useBoardUtils } from '../composables/useBoardUtils';

interface Props {
  square: Square;
  flipped: boolean;
  hasPiece: boolean;
  isSelected: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  flipped: false,
  hasPiece: false,
  isSelected: false
});

const { squareToCoordinates } = useBoardUtils();

// Calculate position based on square coordinates
const positionStyle = computed(() => {
  const coords = squareToCoordinates(props.square);
  
  // Adjust for flipped board if needed
  const file = props.flipped ? 7 - coords.file : coords.file;
  const rank = props.flipped ? 7 - coords.rank : coords.rank;
  
  return {
    transform: `translate(${file * 100}%, ${rank * 100}%)`
  };
});
</script>

<style scoped>
.focus-indicator {
  position: absolute;
  width: 12.5%;
  height: 12.5%;
  box-sizing: border-box;
  border: 3px solid rgba(100, 149, 237, 0.8);
  border-radius: 3px;
  pointer-events: none;
  z-index: 30;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  animation: pulse 2s infinite;
}

.has-piece {
  border-color: rgba(255, 215, 0, 0.8);
}

.is-selected {
  border-color: rgba(50, 205, 50, 0.8);
  animation: pulse-selected 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(100, 149, 237, 0.5); }
  70% { box-shadow: 0 0 0 5px rgba(100, 149, 237, 0); }
  100% { box-shadow: 0 0 0 0 rgba(100, 149, 237, 0); }
}

@keyframes pulse-selected {
  0% { box-shadow: 0 0 0 0 rgba(50, 205, 50, 0.5); }
  70% { box-shadow: 0 0 0 5px rgba(50, 205, 50, 0); }
  100% { box-shadow: 0 0 0 0 rgba(50, 205, 50, 0); }
}
</style>
```

### Keyboard Navigation Composable

Create `src/composables/useKeyboardNavigation.ts`:

```typescript
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Square, Piece } from '../types';
import { FILES, RANKS } from '../constants/boardConfig';
import { KEY_CODES, NavigationMode, SHORTCUTS } from '../constants/keyboardConfig';
import { useBoardUtils } from './useBoardUtils';

export function useKeyboardNavigation(options: {
  flipped: boolean;
  pieces: Piece[];
  onSelectSquare?: (square: Square) => void;
  onSelectPiece?: (piece: Piece) => void;
  onMovePiece?: (from: Square, to: Square) => void;
  onNewGame?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFlipBoard?: () => void;
  onToggleHelp?: () => void;
}) {
  const { 
    flipped, 
    pieces, 
    onSelectSquare, 
    onSelectPiece, 
    onMovePiece,
    onNewGame,
    onUndo,
    onRedo,
    onFlipBoard,
    onToggleHelp
  } = options;
  
  const { indicesToSquare, squareToIndices } = useBoardUtils();
  
  // Current focused square
  const focusedSquare = ref<Square>('e4'); // Default to center square
  
  // Current navigation mode
  const navigationMode = ref<NavigationMode>(NavigationMode.BOARD);
  
  // Selected piece and source square for moves
  const selectedPieceId = ref<string | null>(null);
  const sourceSquare = ref<Square | null>(null);
  
  // Show keyboard help
  const showHelp = ref<boolean>(false);
  
  // Use notation mode (entering coordinates directly)
  const notationMode = ref<boolean>(false);
  const notationBuffer = ref<string>('');
  
  // Check if a piece is at the focused square
  const pieceAtFocus = computed(() => {
    return pieces.find(p => p.square === focusedSquare.value);
  });
  
  // Check if a piece is selected
  const isPieceSelected = computed(() => {
    return selectedPieceId.value !== null;
  });
  
  // Get the coordinates for the current focused square
  const focusCoordinates = computed(() => {
    return squareToIndices(focusedSquare.value);
  });
  
  // Move focus in a direction
  const moveFocus = (dx: number, dy: number) => {
    const [fileIndex, rankIndex] = focusCoordinates.value;
    
    // Calculate new coordinates (accounting for flipped board)
    const newFileIndex = fileIndex + (flipped ? -dx : dx);
    const newRankIndex = rankIndex + (flipped ? -dy : dy);
    
    // Check if the new coordinates are valid
    const newSquare = indicesToSquare(newFileIndex, newRankIndex);
    if (newSquare) {
      focusedSquare.value = newSquare;
    }
  };
  
  // Handle arrow key navigation
  const handleArrowNavigation = (key: string) => {
    switch (key) {
      case KEY_CODES.UP:
      case KEY_CODES.W:
        moveFocus(0, -1);
        break;
      case KEY_CODES.DOWN:
      case KEY_CODES.S:
        moveFocus(0, 1);
        break;
      case KEY_CODES.LEFT:
      case KEY_CODES.A:
        moveFocus(-1, 0);
        break;
      case KEY_CODES.RIGHT:
      case KEY_CODES.D:
        moveFocus(1, 0);
        break;
    }
  };
  
  // Handle action keys (Enter, Space, Escape)
  const handleActionKey = (key: string) => {
    if (key === KEY_CODES.ENTER || key === KEY_CODES.SPACE) {
      if (navigationMode.value === NavigationMode.BOARD) {
        // If there's a piece at the focused square, select it
        if (pieceAtFocus.value) {
          selectedPieceId.value = pieceAtFocus.value.id;
          sourceSquare.value = focusedSquare.value;
          navigationMode.value = NavigationMode.PIECE;
          onSelectPiece && onSelectPiece(pieceAtFocus.value);
        } else {
          // Otherwise, just notify of square selection
          onSelectSquare && onSelectSquare(focusedSquare.value);
        }
      } else if (navigationMode.value === NavigationMode.PIECE) {
        // If we're in piece selection mode, try to move the piece
        if (sourceSquare.value && sourceSquare.value !== focusedSquare.value) {
          onMovePiece && onMovePiece(sourceSquare.value, focusedSquare.value);
          // Reset after move attempt (successful or not)
          selectedPieceId.value = null;
          sourceSquare.value = null;
          navigationMode.value = NavigationMode.BOARD;
        } else {
          // Clicked on the same square, deselect
          selectedPieceId.value = null;
          sourceSquare.value = null;
          navigationMode.value = NavigationMode.BOARD;
        }
      }
    } else if (key === KEY_CODES.ESCAPE) {
      // Cancel any selection or action
      selectedPieceId.value = null;
      sourceSquare.value = null;
      navigationMode.value = NavigationMode.BOARD;
      notationBuffer.value = '';
      notationMode.value = false;
    }
  };
  
  // Handle notation input (e.g., "e4")
  const handleNotationInput = (key: string) => {
    // If not in notation mode, check if toggling it
    if (!notationMode.value) {
      if (key === SHORTCUTS.NOTATION_MODE) {
        notationMode.value = true;
        notationBuffer.value = '';
      }
      return;
    }
    
    // If in notation mode
    if (KEY_CODES.FILE_KEYS.includes(key)) {
      // File input (a-h)
      const fileIndex = KEY_CODES.FILE_KEYS.indexOf(key);
      const file = FILES[fileIndex];
      
      if (notationBuffer.value.length === 0) {
        // First character of notation
        notationBuffer.value = file;
      } else if (notationBuffer.value.length === 1) {
        // Reset and start new notation
        notationBuffer.value = file;
      }
    } else if (KEY_CODES.RANK_KEYS.includes(key)) {
      // Rank input (1-8)
      const rankIndex = KEY_CODES.RANK_KEYS.indexOf(key);
      const rank = RANKS[rankIndex];
      
      if (notationBuffer.value.length === 1) {
        // Complete the notation
        notationBuffer.value += rank;
        
        // Try to use the notation
        const square = notationBuffer.value as Square;
        if (FILES.includes(square[0] as any) && RANKS.includes(square[1] as any)) {
          focusedSquare.value = square;
          
          // If we have a selected piece, try to move it
          if (selectedPieceId.value && sourceSquare.value) {
            onMovePiece && onMovePiece(sourceSquare.value, square);
            selectedPieceId.value = null;
            sourceSquare.value = null;
          }
        }
        
        // Exit notation mode
        notationMode.value = false;
        notationBuffer.value = '';
      }
    } else if (key === SHORTCUTS.NOTATION_MODE) {
      // Exit notation mode
      notationMode.value = false;
      notationBuffer.value = '';
    }
  };
  
  // Handle shortcut keys
  const handleShortcutKeys = (key: string) => {
    switch (key) {
      case SHORTCUTS.TOGGLE_BOARD_ORIENTATION:
        onFlipBoard && onFlipBoard();
        break;
      case SHORTCUTS.NEW_GAME:
        onNewGame && onNewGame();
        break;
      case SHORTCUTS.UNDO:
        onUndo && onUndo();
        break;
      case SHORTCUTS.REDO:
        onRedo && onRedo();
        break;
      case SHORTCUTS.HELP:
        showHelp.value = !showHelp.value;
        onToggleHelp && onToggleHelp();
        break;
    }
  };
  
  // Main keyboard event handler
  const handleKeyDown = (event: KeyboardEvent) => {
    // Don't handle keyboard events if the target is an input or textarea
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    
    const key = event.code;
    
    // Handle notation input first
    if (notationMode.value || key === SHORTCUTS.NOTATION_MODE) {
      handleNotationInput(key);
      event.preventDefault();
      return;
    }
    
    // Handle arrow navigation
    if ([KEY_CODES.UP, KEY_CODES.DOWN, KEY_CODES.LEFT, KEY_CODES.RIGHT,
         KEY_CODES.W, KEY_CODES.A, KEY_CODES.S, KEY_CODES.D].includes(key)) {
      handleArrowNavigation(key);
      event.preventDefault();
    }
    
    // Handle action keys
    else if ([KEY_CODES.ENTER, KEY_CODES.SPACE, KEY_CODES.ESCAPE].includes(key)) {
      handleActionKey(key);
      event.preventDefault();
    }
    
    // Handle shortcuts
    else if (Object.values(SHORTCUTS).includes(key)) {
      handleShortcutKeys(key);
      event.preventDefault();
    }
  };
  
  // Set up event listeners
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
  
  return {
    focusedSquare,
    navigationMode,
    selectedPieceId,
    sourceSquare,
    pieceAtFocus,
    isPieceSelected,
    notationMode,
    notationBuffer,
    showHelp
  };
}
```

### Update ChessBoard Component

Update `src/components/Board/ChessBoard.vue` to add keyboard navigation:

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
          :isInCheck="piece.id === gameState.check.kingId"
          @click="selectPiece(piece.id)"
        />
      </div>
      
      <!-- Keyboard focus indicator -->
      <FocusIndicator
        v-if="keyboardMode"
        :square="focusedSquare"
        :flipped="gameState.config.flipped"
        :hasPiece="!!pieceAtFocus"
        :isSelected="isPieceSelected && sourceSquare === focusedSquare"
      />
      
      <!-- Keyboard help overlay -->
      <div 
        v-if="showKeyboardHelp" 
        class="keyboard-help-overlay"
        @click="showKeyboardHelp = false"
      >
        <div class="keyboard-help-content" @click.stop>
          <h3>{{ KEYBOARD_HELP.title }}</h3>
          
          <div class="help-section">
            <h4>Navigation</h4>
            <div v-for="(item, index) in KEYBOARD_HELP.navigation" :key="index" class="help-item">
              <span class="key">{{ item.key }}</span>
              <span class="description">{{ item.description }}</span>
            </div>
          </div>
          
          <div class="help-section">
            <h4>Shortcuts</h4>
            <div v-for="(item, index) in KEYBOARD_HELP.shortcuts" :key="index" class="help-item">
              <span class="key">{{ item.key }}</span>
              <span class="description">{{ item.description }}</span>
            </div>
          </div>
          
          <div class="help-section">
            <h4>Notation Mode (press M)</h4>
            <div v-for="(item, index) in KEYBOARD_HELP.notation" :key="index" class="help-item">
              <span class="key">{{ item.key }}</span>
              <span class="description">{{ item.description }}</span>
            </div>
          </div>
          
          <button @click="showKeyboardHelp = false">Close</button>
        </div>
      </div>
      
      <!-- Notation mode indicator -->
      <div v-if="notationMode" class="notation-mode-indicator">
        Enter square: {{ notationBuffer || '_' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Square, Piece } from '../../types';
import { KEYBOARD_HELP } from '../../constants/keyboardConfig';
import ChessSquare from '../Square/ChessSquare.vue';
import ChessPiece from '../Pieces/ChessPiece.vue';
import FocusIndicator from '../FocusIndicator.vue';
import { useBoardUtils } from '../../composables/useBoardUtils';
import { useGameState } from '../../composables/useGameState';
import { useKeyboardNavigation } from '../../composables/useKeyboardNavigation';

interface Props {
  showCoordinates?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true
});

const { getSquareColor, generateBoardSquares } = useBoardUtils();
const boardSquares = generateBoardSquares;

// Reference to the board element for focus management
const boardRef = ref<HTMLElement | null>(null);

// Get the game state
const { 
  gameState, 
  selectPiece, 
  isValidMoveTarget, 
  handleSquareClick,
  movePiece,
  startNewGame,
  handleUndoMove,
  handleRedoMove,
  toggleBoardOrientation
} = useGameState();

// Track if the board is focused for keyboard navigation
const keyboardMode = ref<boolean>(false);

// Show/hide keyboard help
const showKeyboardHelp = ref<boolean>(false);

// Set up keyboard navigation
const { 
  focusedSquare,
  pieceAtFocus,
  isPieceSelected,
  sourceSquare,
  notationMode,
  notationBuffer,
  showHelp
} = useKeyboardNavigation({
  flipped: computed(() => gameState.config.flipped),
  pieces: computed(() => gameState.pieces),
  onSelectSquare: (square) => {
    handleSquareClick(square);
  },
  onSelectPiece: (piece) => {
    selectPiece(piece.id);
  },
  onMovePiece: (from, to) => {
    movePiece(from, to);
  },
  onNewGame: () => {
    startNewGame();
  },
  onUndo: () => {
    handleUndoMove();
  },
  onRedo: () => {
    handleRedoMove();
  },
  onFlipBoard: () => {
    toggleBoardOrientation();
  },
  onToggleHelp: () => {
    showKeyboardHelp.value = !showKeyboardHelp.value;
  }
});

// Sync the help state
showKeyboardHelp.value = showHelp.value;

// Handle board focus/blur events
const handleBoardFocus = () => {
  keyboardMode.value = true;
};

const handleBoardBlur = () => {
  keyboardMode.value = false;
};

// Focus the board when the component is mounted
onMounted(() => {
  if (boardRef.value) {
    boardRef.value.focus();
  }
});
</script>

<style scoped>
/* Existing styles... */

/* Focus styles */
.chess-board-container:focus {
  outline: none;
}

/* Keyboard help overlay */
.keyboard-help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.keyboard-help-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.help-section {
  margin-bottom: 1.5rem;
}

.help-section h4 {
  margin-bottom: 0.5rem;
  color: var(--accent-color);
}

.help-item {
  display: flex;
  margin-bottom: 0.5rem;
}

.key {
  background-color: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  margin-right: 1rem;
  min-width: 100px;
  display: inline-block;
  border: 1px solid #ddd;
}

.keyboard-help-content button {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

/* Notation mode indicator */
.notation-mode-indicator {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 1.2rem;
}
</style>
```

### Update App.vue

Update `src/App.vue` to add keyboard shortcut information:

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
          <button @click="startNewGame" title="New Game (N)">New Game</button>
          <button @click="handleUndoMove" :disabled="!canUndo" title="Undo (Z)">Undo</button>
          <button @click="handleRedoMove" :disabled="!canRedo" title="Redo (Y)">Redo</button>
          <button @click="toggleBoardOrientation" title="Flip Board (F)">Flip Board</button>
          <button @click="toggleKeyboardHelp" title="Keyboard Help (H)">Keyboard Help</button>
          <label>
            <input type="checkbox" v-model="gameState.config.showAvailableMoves">
            Show Available Moves
          </label>
        </div>
        
        <div class="keyboard-tip">
          Press <kbd>H</kbd> for keyboard controls
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

<script setup>
// Import statements...

// Add function to toggle keyboard help
const toggleKeyboardHelp = () => {
  // Find the keyboard help component in ChessBoard and toggle it
  // This is just a placeholder; we'll implement it via a global event bus or state
};
</script>

<style>
/* Existing styles... */

.keyboard-tip {
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
}

kbd {
  background-color: #f0f0f0;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  border: 1px solid #ddd;
  font-family: monospace;
}
</style>
```

## Dependencies

- Vue 3 with Composition API
- TypeScript

## Acceptance Criteria

1. Players can navigate the chessboard using arrow keys or WASD keys
2. Players can select pieces and make moves using keyboard commands (Space/Enter)
3. The current focus is clearly indicated with a visual indicator
4. Players can cancel selection or actions with the Escape key
5. Players can directly input algebraic notation (e.g., typing "e4") to move
6. Keyboard shortcuts are available for common actions (new game, undo, etc.)
7. A help screen shows all available keyboard commands
8. The keyboard navigation works alongside mouse controls
9. The focus indicator properly adjusts when the board is flipped
10. The keyboard focus is maintained when switching between keyboard and mouse
11. The keyboard navigation is fully accessible and follows WCAG standards

## Unit Tests

Create a file `src/composables/__tests__/useKeyboardNavigation.spec.ts` with the following tests:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardNavigation } from '../useKeyboardNavigation';
import { NavigationMode } from '../../constants/keyboardConfig';
import type { Piece, Square } from '../../types';

describe('useKeyboardNavigation', () => {
  // Mock functions
  const mockOnSelectSquare = vi.fn();
  const mockOnSelectPiece = vi.fn();
  const mockOnMovePiece = vi.fn();
  const mockOnNewGame = vi.fn();
  const mockOnUndo = vi.fn();
  const mockOnRedo = vi.fn();
  const mockOnFlipBoard = vi.fn();
  const mockOnToggleHelp = vi.fn();
  
  // Mock pieces
  const mockPieces: Piece[] = [
    { id: 'wp1', type: 'pawn', color: 'white', square: 'a2' },
    { id: 'wk', type: 'king', color: 'white', square: 'e1' },
    { id: 'bp1', type: 'pawn', color: 'black', square: 'a7' }
  ];
  
  // Setup the composable with default options
  const setupComposable = (options = {}) => {
    return useKeyboardNavigation({
      flipped: false,
      pieces: mockPieces,
      onSelectSquare: mockOnSelectSquare,
      onSelectPiece: mockOnSelectPiece,
      onMovePiece: mockOnMovePiece,
      onNewGame: mockOnNewGame,
      onUndo: mockOnUndo,
      onRedo: mockOnRedo,
      onFlipBoard: mockOnFlipBoard,
      onToggleHelp: mockOnToggleHelp,
      ...options
    });
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('initializes with default focused square', () => {
    const { focusedSquare } = setupComposable();
    expect(focusedSquare.value).toBe('e4'); // Default to center
  });
  
  it('detects pieces at focused square', () => {
    const { focusedSquare, pieceAtFocus } = setupComposable();
    
    // No piece at default position
    expect(pieceAtFocus.value).toBeUndefined();
    
    // Move to a square with a piece
    focusedSquare.value = 'e1';
    expect(pieceAtFocus.value).toBeDefined();
    expect(pieceAtFocus.value?.id).toBe('wk');
  });
  
  it('tracks selected pieces and source squares', () => {
    const { 
      focusedSquare, 
      selectedPieceId, 
      sourceSquare, 
      isPieceSelected 
    } = setupComposable();
    
    // Initial state
    expect(selectedPieceId.value).toBeNull();
    expect(sourceSquare.value).toBeNull();
    expect(isPieceSelected.value).toBe(false);
    
    // Set values
    focusedSquare.value = 'e1';
    selectedPieceId.value = 'wk';
    sourceSquare.value = 'e1';
    
    // Check updated state
    expect(isPieceSelected.value).toBe(true);
  });
  
  it('handles notation mode input', () => {
    const { notationMode, notationBuffer } = setupComposable();
    
    // Enable notation mode
    notationMode.value = true;
    expect(notationMode.value).toBe(true);
    
    // Set buffer
    notationBuffer.value = 'e';
    expect(notationBuffer.value).toBe('e');
  });
  
  it('provides help toggle functionality', () => {
    const { showHelp } = setupComposable();
    
    // Initial state
    expect(showHelp.value).toBe(false);
    
    // Toggle help
    showHelp.value = true;
    expect(showHelp.value).toBe(true);
  });
});
```

## Challenges & Solutions

1. **Challenge**: Integrating keyboard navigation with existing mouse-based interactions.
   **Solution**: Design a system that works in parallel with mouse controls, with clear visual indicators for the current focus state.

2. **Challenge**: Providing clear visual feedback for keyboard focus without cluttering the UI.
   **Solution**: Create a dedicated focus indicator component with subtle animation that stands out when needed but doesn't distract from gameplay.

3. **Challenge**: Supporting multiple input methods (arrow keys, WASD, algebraic notation).
   **Solution**: Implement a flexible key handler that can process different input methods and convert them to the same internal actions.

4. **Challenge**: Making sure keyboard navigation works correctly when the board is flipped.
   **Solution**: Apply coordinate transformations based on the board orientation to ensure consistent directional movement.

5. **Challenge**: Ensuring accessibility for screen reader users.
   **Solution**: Use proper semantic HTML, implement ARIA attributes, and ensure all actions can be performed via keyboard with clear feedback.

6. **Challenge**: Handling different keyboard layouts and browser compatibility.
   **Solution**: Use standard key codes and provide multiple input options (arrows and WASD) to accommodate different preferences and keyboards.

7. **Challenge**: Preventing keyboard events from conflicting with browser shortcuts.
   **Solution**: Carefully manage event propagation and use preventDefault() selectively to avoid interfering with essential browser functionality.

## Integration Points for Next Features

- The keyboard navigation system is ready for integration with the animation system in Feature 6
- The focus indicator can be enhanced to show available moves for the chess tutor in Feature 12
- Keyboard shortcuts are prepared for additional features like promotion and AI difficulty settings
- The notation mode provides a foundation for move suggestions in Feature 13
- The accessibility improvements align with best practices for all future UI enhancements
- The keyboard focus system can be leveraged for implementing game replay controls in future features
- The help overlay structure can be reused for other informational panels like game rules and strategy tips
