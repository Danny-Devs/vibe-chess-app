<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ChessBoard } from './components/Board'
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Vibe Chess</h1>
    </header>

    <main class="main-content">
      <ChessBoard />
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
}

.header {
  padding: 1rem;
  text-align: center;
  background-color: var(--primary-color);
  color: white;
  width: 100%;
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

.footer {
  padding: 1rem;
  text-align: center;
  background-color: var(--primary-color);
  color: white;
  font-size: 0.8rem;
  width: 100%;
}
</style>
