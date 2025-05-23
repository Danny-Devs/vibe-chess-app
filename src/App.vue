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

          <!-- Add turn indicator -->
          <div
            v-if="gameStore.gameStarted"
            class="turn-indicator"
            :class="{
              'white-turn': gameStore.whoseTurn === 'white',
              'black-turn': gameStore.whoseTurn === 'black',
            }"
          >
            <div class="turn-piece"></div>
            <div class="turn-text">
              {{ gameStore.whoseTurn === 'white' ? 'White' : 'Black' }}'s Turn
            </div>
          </div>

          <div class="game-controls">
            <button @click="handleStartNewGame">New Game</button>
            <button @click="gameStore.handleUndoMove" :disabled="!gameStore.canUndo">Undo</button>
            <button @click="gameStore.handleRedoMove" :disabled="!gameStore.canRedo">Redo</button>
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
              <div v-if="gameStore.activeMoves.length === 0" class="history-placeholder">
                No moves yet
              </div>
              <div v-else class="history-moves">
                <!-- Group moves by turn number (one white move + one black move per line) -->
                <div
                  v-for="turnNumber in Math.ceil(gameStore.activeMoves.length / 2)"
                  :key="turnNumber"
                  class="history-turn"
                >
                  <!-- Turn number -->
                  <div class="move-number">{{ turnNumber }}.</div>

                  <div class="move-pair">
                    <!-- White's move (always exists) -->
                    <div class="move-text white-move">
                      {{ gameStore.activeMoves[(turnNumber - 1) * 2].notation }}
                    </div>

                    <!-- Black's move (may not exist in the last turn) -->
                    <div
                      v-if="(turnNumber - 1) * 2 + 1 < gameStore.activeMoves.length"
                      class="move-text black-move"
                    >
                      {{ gameStore.activeMoves[(turnNumber - 1) * 2 + 1].notation }}
                    </div>
                    <div v-else class="move-text placeholder"></div>
                  </div>
                </div>
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
  padding: 0.6rem;
  text-align: center;
  background-color: var(--primary-color);
  color: white;
  width: 100%;
}

.header h1 {
  margin: 0.3rem 0;
}

.game-status {
  font-size: 1.3rem;
  font-weight: bold;
  text-align: center;
  margin: 0.2rem 0 0.5rem;
  padding: 0.6rem;
  color: var(--primary-color);
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 0;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.3rem;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}

.game-container {
  display: flex;
  width: 100%;
  max-width: 1800px;
  justify-content: center;
  gap: 0.8rem;
}

.side-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0.7rem;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.left-panel {
  justify-content: flex-start;
}

.right-panel {
  justify-content: flex-start;
}

.board-container {
  width: 800px;
  height: 800px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  border-radius: 0;
  overflow: hidden;
}

.game-controls {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.game-controls button {
  padding: 0.9rem 1rem;
  font-size: 1.1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 0;
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
  margin-bottom: 0.4rem;
  text-align: center;
  font-size: 1.3rem;
}

.history-container {
  flex: 1;
  overflow-y: auto;
  background-color: white;
  border-radius: 0;
  padding: 0.4rem;
  min-height: 350px;
}

.history-moves {
  display: flex;
  flex-direction: column;
  padding: 0.4rem;
}

.history-turn {
  display: flex;
  margin-bottom: 0.5rem;
  align-items: flex-start;
  line-height: 1.5;
}

.move-number {
  font-weight: bold;
  color: #555;
  min-width: 2rem;
  text-align: right;
  padding-right: 0.5rem;
}

.move-pair {
  display: flex;
  flex: 1;
}

.move-text {
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  min-width: 4rem;
  padding: 0 0.5rem;
  cursor: default;
}

.white-move {
  color: var(--accent-color);
}

.black-move {
  color: #333;
}

.placeholder {
  /* Empty space for missing black move */
  min-width: 3.5rem;
}

.history-placeholder {
  color: #888;
  text-align: center;
  padding: 1rem;
}

.footer {
  padding: 0.5rem;
  text-align: center;
  background-color: var(--primary-color);
  color: white;
  font-size: 0.8rem;
  width: 100%;
}

/* Responsive adjustments */
@media (max-width: 1400px) {
  .board-container {
    width: 700px;
    height: 700px;
  }

  .side-panel {
    width: 260px;
  }
}

@media (max-width: 1240px) {
  .board-container {
    width: 650px;
    height: 650px;
  }

  .side-panel {
    width: 240px;
  }
}

@media (max-width: 1150px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }

  .side-panel {
    width: 100%;
    max-width: 700px;
    margin-bottom: 0.7rem;
  }

  .board-container {
    width: 100%;
    max-width: 700px;
    height: auto;
    aspect-ratio: 1 / 1;
  }

  .game-controls {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
  }

  .game-controls button {
    min-width: 120px;
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
    max-width: 450px;
  }

  .game-controls button {
    padding: 0.7rem 0.8rem;
    font-size: 1rem;
  }
}

/* Remove the following rule so all disabled buttons use the same style */
/* .flip-board-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
} */

.turn-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem;
  margin: 0.2rem 0 0.6rem;
  background-color: rgba(255, 255, 255, 0.85);
  border-radius: 0;
  font-weight: bold;
  transition: all 0.3s ease;
}

.turn-piece {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-right: 12px;
}

.white-turn .turn-piece {
  background-color: #fff;
  border: 2px solid #333;
}

.black-turn .turn-piece {
  background-color: #333;
  border: 2px solid #333;
}

.white-turn {
  border-left: 4px solid var(--accent-color);
}

.black-turn {
  border-left: 4px solid #333;
}

.turn-text {
  font-size: 1.2rem;
}

.white-turn .turn-text {
  color: var(--accent-color);
}

.black-turn .turn-text {
  color: #333;
}
</style>
