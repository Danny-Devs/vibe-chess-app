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
import { ref } from 'vue'
import { ChessSquare } from '../Square'
import { useBoardUtils } from '../../composables/useBoardUtils'

interface Props {
  showCoordinates?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: true,
})

const { getSquareColor, generateBoardSquares } = useBoardUtils()
const boardSquares = generateBoardSquares

// Future state for board manipulation will be added here
</script>

<style scoped>
.chess-board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  width: 100%;
  max-width: 100vw;
  max-height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
}

.chess-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  /* Responsive sizing that considers both viewport dimensions */
  width: min(90vmin, min(90%, 800px));
  height: min(90vmin, min(90%, 800px));
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border: 2px solid #333;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  /* Subtle wireframe glow effect */
  box-shadow:
    0 0 10px rgba(100, 149, 237, 0.5),
    0 0 20px rgba(100, 149, 237, 0.2);
}

/* CSS Variables should be in global scope, not in :root inside a scoped style */
</style>
