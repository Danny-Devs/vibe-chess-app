<template>
  <svg
    style="position: absolute; width: 0; height: 0"
    width="0"
    height="0"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Pawn - simple drop shape -->
      <g id="piece-pawn">
        <circle cx="15" cy="12" r="6" />
        <path d="M9,12 L15,24 L21,12 Z" />
        <rect x="9" y="24" width="12" height="2" />
      </g>

      <!-- Rook - simple castle shape -->
      <g id="piece-rook">
        <rect x="8" y="10" width="18" height="14" />
        <rect x="8" y="24" width="18" height="2" />
        <path d="M8,10 L8,6 L12,6 L12,8 L16,8 L16,6 L20,6 L20,8 L24,8 L24,6 L28,6 L28,10 Z" />
      </g>

      <!-- Knight - simplified horse head -->
      <g id="piece-knight">
        <path
          d="M10,26 L10,16 C10,12 14,10 18,10 C22,10 25,12 25,14 C25,16 24,18 26,20 C28,22 26,26 22,26 Z"
        />
        <rect x="10" y="26" width="16" height="2" />
      </g>

      <!-- Bishop - simple mitre shape -->
      <g id="piece-bishop">
        <path d="M15,8 L10,24 L20,24 Z" />
        <circle cx="15" cy="8" r="4" />
        <rect x="10" y="24" width="10" height="2" />
      </g>

      <!-- Queen - crown shape -->
      <g id="piece-queen">
        <rect x="10" y="20" width="15" height="6" />
        <path d="M10,20 L8,12 L12,16 L15,8 L18,16 L22,12 L25,20 Z" />
        <rect x="8" y="26" width="19" height="2" />
      </g>

      <!-- King - simplified crown with cross -->
      <g id="piece-king">
        <rect x="10" y="20" width="15" height="6" />
        <path d="M10,20 L10,16 L14,16 L14,12 L16,12 L16,16 L20,16 L20,20 Z" />
        <rect x="8" y="26" width="19" height="2" />
      </g>
    </defs>
  </svg>
</template>

<script setup lang="ts">
// No script content needed for SVG definitions
</script>

<style scoped>
/* No styling needed for simplified pieces */
</style>
