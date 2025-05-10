<template>
  <div class="debug-panel">
    <h3>Debug Panel</h3>
    <div class="debug-controls">
      <button class="debug-button capture-test-button" @click="loadDebugPosition('captureTest')">
        Test Captures
      </button>
      <button class="debug-button" @click="loadDebugPosition('checkmate')">Test Checkmate</button>
      <button class="debug-button" @click="loadDebugPosition('stalemate')">Test Stalemate</button>
      <button class="debug-button" @click="loadDebugPosition('oneMove')">1-Move Checkmate</button>
      <button class="debug-button" @click="loadDebugPosition('almostStalemate')">
        Almost Stalemate
      </button>
    </div>
    <div class="debug-instructions" v-if="currentDebugPosition">
      <strong>Current Debug Position: {{ currentDebugPosition }}</strong>
      <p v-if="currentDebugPosition === 'captureTest'">
        White to move. Try clicking on the white pawn at e4, then clicking on either black pawn at
        d5 or f5 to capture.
      </p>
      <p v-else-if="currentDebugPosition === 'checkmate'">
        Black is in checkmate. Game should be over.
      </p>
      <p v-else-if="currentDebugPosition === 'stalemate'">
        Black is in stalemate. Game should be over.
      </p>
      <p v-else-if="currentDebugPosition === 'oneMove'">White to move. Queen to h7 is checkmate.</p>
      <p v-else-if="currentDebugPosition === 'almostStalemate'">
        White to move. Queen to g7 creates stalemate.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/gameStore'
import { ref } from 'vue'

const gameStore = useGameStore()
const currentDebugPosition = ref('')

function loadDebugPosition(
  position: 'checkmate' | 'stalemate' | 'oneMove' | 'almostStalemate' | 'captureTest',
) {
  gameStore.loadDebugPosition(position)
  currentDebugPosition.value = position
}
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid #555;
  border-radius: 4px;
  padding: 10px;
  z-index: 1000;
  max-width: 300px;
  color: white;
}

.debug-title {
  color: #fff;
  font-size: 14px;
  margin: 0 0 10px 0;
  text-align: center;
}

.debug-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.debug-button {
  background-color: #444;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 3px;
}

.debug-button:hover {
  background-color: #666;
}

.capture-test-button {
  background-color: #2c974b;
  font-weight: bold;
}

.capture-test-button:hover {
  background-color: #35b959;
}

.debug-btn {
  background-color: #4a4a4a;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.debug-btn:hover {
  background-color: #666;
}

.debug-btn:active {
  background-color: #333;
}

.debug-instructions {
  font-size: 0.9rem;
  margin-top: 10px;
  border-top: 1px solid #555;
  padding-top: 10px;
}
</style>
