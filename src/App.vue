<script setup lang="ts">
import { ref } from 'vue'
import { ChessBoard } from './components/Board'
import { useGameStore } from './stores/gameStore'

// Use the game store from Pinia
const gameStore = useGameStore()

// Add a key to force component re-rendering when starting a new game
const chessBoardKey = ref(0)

// Create a function to handle starting a new game
const handleStartNewGame = () => {
  gameStore.startNewGame()
  // Increment the key to force the ChessBoard component to re-render
  chessBoardKey.value++
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Vibe Chess</h1>
    </header>

    <main class="main-content">
      <div class="game-container">
        <div class="side-panel left-panel">
          <div class="game-status">{{ gameStore.statusMessage }}</div>
          <div class="game-controls">
            <button @click="handleStartNewGame">New Game</button>
            <button @click="gameStore.handleUndoMove" :disabled="!gameStore.canUndo">Undo</button>
            <button @click="gameStore.handleRedoMove" :disabled="!gameStore.canRedo">Redo</button>
            <button @click="gameStore.toggleBoardOrientation">Flip Board</button>
            <label class="control-option">
              <input type="checkbox" v-model="gameStore.config.showAvailableMoves" />
              Show Available Moves
            </label>
          </div>
        </div>

        <div class="board-container">
          <ChessBoard :key="chessBoardKey" :showCoordinates="true" />
        </div>

        <div class="side-panel right-panel">
          <div class="move-history">
            <h3>Move History</h3>
            <div class="history-container">
              <div v-if="gameStore.history.moves.length === 0" class="history-placeholder">
                No moves yet
              </div>
              <div v-else class="history-moves">
                <template v-for="(move, index) in gameStore.history.moves" :key="index">
                  <div class="history-item">
                    <span v-if="index % 2 === 0" class="move-number"
                      >{{ Math.floor(index / 2) + 1 }}.</span
                    >
                    <span
                      class="move-text"
                      :class="{ 'white-move': index % 2 === 0, 'black-move': index % 2 === 1 }"
                    >
                      {{ move.notation }}
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>Vibe Chess - Version 0.1</p>
    </footer>
  </div>
</template>

<style>
/* Global styles */
:root {
  --primary-color: #333;
  --accent-color: #4a86e8;
  --background-color: #f9f9f9;
  --text-color: #333;
  --light-square-color: #f0d9b5;
  --dark-square-color: #b58863;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-x: hidden;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
  background-color: var(--background-color);
}

.header {
  padding: 1rem;
  text-align: center;
  background-color: var(--primary-color);
  color: white;
  width: 100%;
}

.game-status {
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  margin: 0.5rem 0 1rem;
  padding: 0.5rem;
  color: var(--primary-color);
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}

.game-container {
  display: flex;
  width: 100%;
  max-width: 1400px;
  justify-content: center;
  gap: 1.5rem;
}

.side-panel {
  width: 220px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.left-panel {
  justify-content: flex-start;
}

.right-panel {
  justify-content: flex-start;
}

.board-container {
  width: 650px;
  height: 650px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.game-controls {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.game-controls button {
  padding: 0.75rem 1rem;
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

.control-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
}

.move-history {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.move-history h3 {
  margin-bottom: 0.5rem;
  text-align: center;
}

.history-container {
  flex: 1;
  overflow-y: auto;
  background-color: white;
  border-radius: 4px;
  padding: 0.5rem;
  min-height: 300px;
}

.history-moves {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
}

.history-item {
  display: flex;
  margin-bottom: 0.8rem;
  align-items: flex-start;
}

.move-number {
  font-weight: bold;
  margin-right: 0.5rem;
  color: #555;
  min-width: 1.5rem;
}

.move-text {
  font-family: 'Roboto Mono', monospace;
  font-size: 1rem;
  font-weight: 500;
}

.white-move {
  color: var(--accent-color);
}

.black-move {
  color: #333;
}

.history-placeholder {
  color: #888;
  text-align: center;
  padding: 1rem;
}

.footer {
  padding: 1rem;
  text-align: center;
  background-color: var(--primary-color);
  color: white;
  font-size: 0.8rem;
  width: 100%;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .board-container {
    width: 580px;
    height: 580px;
  }
}

@media (max-width: 1000px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }

  .side-panel {
    width: 100%;
    max-width: 600px;
    margin-bottom: 1rem;
  }

  .board-container {
    width: 100%;
    max-width: 600px;
    height: auto;
    aspect-ratio: 1 / 1;
  }

  .game-controls {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .right-panel {
    order: 3;
  }

  .left-panel {
    order: 1;
  }

  .board-container {
    order: 2;
  }
}

@media (max-width: 480px) {
  .board-container {
    width: 100%;
    max-width: 350px;
  }

  .game-controls button {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }
}
</style>
