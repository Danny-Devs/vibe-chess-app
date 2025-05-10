# Feature 1: Chessboard Setup

## Description

Create the foundation of the chess application by implementing a responsive, visually appealing chessboard using CSS Grid. The board should follow standard chess notation (files a-h, ranks 1-8) and include proper coloring of squares. This feature will establish the visual foundation for all subsequent features.

## Technical Implementation

### Project Setup

1. The project has already been setup.

2. Set up the folder structure:
```
src/
├── components/
│   ├── Board/
│   │   ├── ChessBoard.vue
│   │   └── index.ts
│   ├── Square/
│   │   ├── ChessSquare.vue
│   │   └── index.ts
│   └── index.ts
├── composables/
│   └── useBoardUtils.ts
├── constants/
│   └── boardConfig.ts
├── types/
│   └── index.ts
├── App.vue
└── main.ts
```

### Key Files

#### 1. types/index.ts
```typescript
export type SquareColor = "light" | "dark";
export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type Square = `${File}${Rank}`;
export type BoardPosition = {
  file: File;
  rank: Rank;
};
```

#### 2. constants/boardConfig.ts
```typescript
// Define board dimensions and colors
export const BOARD_SIZE = 8;
export const LIGHT_SQUARE = "#f0d9b5";
export const DARK_SQUARE = "#b58863";
export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;
```

#### 3. composables/useBoardUtils.ts
```typescript
import { computed } from 'vue';
import { RANKS, FILES } from '../constants/boardConfig';
import type { SquareColor, Square } from '../types';

export function useBoardUtils() {
  /**
   * Determines if a square should be light or dark
   */
  const getSquareColor = (file: string, rank: string): SquareColor => {
    const fileIndex = FILES.indexOf(file as any);
    const rankIndex = RANKS.indexOf(rank as any);
    return (fileIndex + rankIndex) % 2 === 0 ? "dark" : "light";
  };

  /**
   * Generates all squares on the chess board in the correct order
   */
  const generateBoardSquares = computed((): Square[] => {
    const squares: Square[] = [];
    
    for (const rank of RANKS) {
      for (const file of FILES) {
        squares.push(`${file}${rank}` as Square);
      }
    }
    
    return squares;
  });

  /**
   * Converts algebraic notation (e.g., "e4") to board coordinates
   */
  const squareToCoordinates = (square: Square): { file: number; rank: number } => {
    const file = FILES.indexOf(square[0] as any);
    const rank = RANKS.indexOf(square[1] as any);
    return { file, rank };
  };

  return {
    getSquareColor,
    generateBoardSquares,
    squareToCoordinates
  };
}
```

#### 4. components/Square/ChessSquare.vue
```vue
<template>
  <div 
    class="chess-square" 
    :class="[color]"
    :data-square="square"
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
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true
});

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
.chess-square {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.light {
  background-color: var(--light-square-color, #f0d9b5);
}

.dark {
  background-color: var(--dark-square-color, #b58863);
}

.coordinate {
  position: absolute;
  font-size: 0.8rem;
  opacity: 0.7;
  pointer-events: none;
}

/* For rank labels */
.chess-square[data-square^="a"] .coordinate {
  left: 5px;
  bottom: 5px;
}

/* For file labels */
.chess-square[data-square$="1"] .coordinate {
  right: 5px;
  bottom: 5px;
}
</style>
```

#### 5. components/Board/ChessBoard.vue
```vue
<template>
  <div class="chess-board-container">
    <div class="chess-board">
      <ChessSquare
        v-for="square in boardSquares"
        :key="square"
        :square="square"
        :color="getSquareColor(square[0], square[1])"
        :showCoordinates="showCoordinates"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ChessSquare from '../Square/ChessSquare.vue';
import { useBoardUtils } from '../../composables/useBoardUtils';

interface Props {
  showCoordinates?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true
});

const { getSquareColor, generateBoardSquares } = useBoardUtils();
const boardSquares = generateBoardSquares;

// Future state for board manipulation will be added here
</script>

<style scoped>
.chess-board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.chess-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: min(80vh, 600px);
  height: min(80vh, 600px);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border: 2px solid #333;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  
  /* Subtle wireframe glow effect */
  box-shadow: 0 0 10px rgba(100, 149, 237, 0.5),
              0 0 20px rgba(100, 149, 237, 0.2);
}

/* CSS Variables for theming */
:root {
  --light-square-color: #f0d9b5;
  --dark-square-color: #b58863;
}
</style>
```

#### 6. App.vue
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
  </div>
</template>

<script setup lang="ts">
import ChessBoard from './components/Board/ChessBoard.vue';
</script>

<style>
/* Global styles */
:root {
  --primary-color: #333;
  --accent-color: #4a86e8;
  --background-color: #f9f9f9;
  --text-color: #333;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Arial', sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  padding: 1rem;
  text-align: center;
  background-color: var(--primary-color);
  color: white;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.footer {
  padding: 1rem;
  text-align: center;
  background-color: var(--primary-color);
  color: white;
  font-size: 0.8rem;
}
</style>
```

## Dependencies

- Vue 3
- TypeScript
- GSAP (for animations in future features)
- Vitest (for testing)

## Acceptance Criteria

1. The chessboard displays an 8x8 grid with alternating light and dark squares
2. The board has proper chess notation with files (a-h) and ranks (1-8)
3. The squares are correctly colored (light squares at a1, c1, e1, g1, etc.)
4. The board is responsive and maintains its aspect ratio on different screen sizes
5. The board has subtle styling consistent with the digital wireframe aesthetic
6. File and rank labels are visible on the edges of the board

## Unit Tests

Create a file `src/components/Board/__tests__/ChessBoard.spec.ts` with the following tests:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChessBoard from '../ChessBoard.vue';
import ChessSquare from '../../Square/ChessSquare.vue';

describe('ChessBoard', () => {
  it('renders the board with 64 squares', () => {
    const wrapper = mount(ChessBoard);
    const squares = wrapper.findAllComponents(ChessSquare);
    expect(squares.length).toBe(64);
  });

  it('alternates square colors correctly', () => {
    const wrapper = mount(ChessBoard);
    const squares = wrapper.findAllComponents(ChessSquare);
    
    // Check a few key squares for correct coloring
    // a1 should be light (odd sum of indices)
    expect(squares[56].props('color')).toBe('light');
    
    // a8 should be dark (even sum of indices)
    expect(squares[0].props('color')).toBe('dark');
    
    // e4 should be light
    const e4Index = 8 * 4 + 4; // Approximation, depends on board orientation
    expect(squares[e4Index].props('color')).toBe('light');
  });

  it('shows coordinates when showCoordinates prop is true', () => {
    const wrapper = mount(ChessBoard, {
      props: {
        showCoordinates: true
      }
    });
    
    // Check that coordinates are visible
    const container = wrapper.find('.chess-board');
    expect(container.find('.coordinate').exists()).toBe(true);
  });

  it('hides coordinates when showCoordinates prop is false', () => {
    const wrapper = mount(ChessBoard, {
      props: {
        showCoordinates: false
      }
    });
    
    // Coordinates should not be visible
    const squares = wrapper.findAllComponents(ChessSquare);
    squares.forEach(square => {
      expect(square.props('showCoordinates')).toBe(false);
    });
  });
});
```

## Challenges & Solutions

1. **Challenge**: Ensuring the board maintains a perfect square aspect ratio.
   **Solution**: Use a combination of CSS Grid and the `aspect-ratio` property, with a fallback using the min function for older browsers.

2. **Challenge**: Correctly positioning the file and rank labels without cluttering the UI.
   **Solution**: Only show labels on the edges of the board (rank labels on the a-file, file labels on the 1-rank).

3. **Challenge**: Making sure the board colors are correct (white square at bottom right).
   **Solution**: Implement the `getSquareColor` function to determine colors based on file and rank indices.

4. **Challenge**: Setting up the project structure for easy expansion.
   **Solution**: Clear separation of components, types, and utilities from the start.

## Integration Points for Next Features

- The ChessBoard component is prepared to accept pieces as children
- The square components have data attributes for easy targeting in the next steps
- The composables and types are set up for use in game state management
