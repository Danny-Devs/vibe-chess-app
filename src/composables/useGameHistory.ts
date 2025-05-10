import { ref, computed } from 'vue'
import type { Move, Piece, GameHistory } from '../types'

export function useGameHistory() {
  // Store the history of moves and positions
  const history = ref<GameHistory>({
    moves: [],
    positions: [],
  })

  // Current position index (for navigating history)
  const currentPositionIndex = ref<number>(0)

  // List of all moves in standard notation
  const moveNotations = computed(() => {
    return history.value.moves.map((move) => move.notation)
  })

  // Add a move to the history
  const addMove = (move: Move, newPosition: Piece[]) => {
    // If we're not at the end of history (i.e., we've navigated back), truncate
    if (currentPositionIndex.value < history.value.moves.length) {
      history.value.moves = history.value.moves.slice(0, currentPositionIndex.value)
      history.value.positions = history.value.positions.slice(0, currentPositionIndex.value + 1)
    }

    history.value.moves.push(move)
    history.value.positions.push([...newPosition])
    currentPositionIndex.value = history.value.moves.length
  }

  // Navigate to a specific position in history
  const goToPosition = (index: number): Piece[] => {
    if (index >= 0 && index <= history.value.positions.length - 1) {
      currentPositionIndex.value = index
      return [...history.value.positions[index]]
    }
    return []
  }

  // Go back one move
  const undoMove = (): Piece[] => {
    if (currentPositionIndex.value > 0) {
      currentPositionIndex.value--
      return [...history.value.positions[currentPositionIndex.value]]
    }
    return []
  }

  // Go forward one move
  const redoMove = (): Piece[] => {
    if (currentPositionIndex.value < history.value.positions.length - 1) {
      currentPositionIndex.value++
      return [...history.value.positions[currentPositionIndex.value]]
    }
    return []
  }

  // Reset history
  const resetHistory = (initialPosition: Piece[]) => {
    history.value = {
      moves: [],
      positions: [initialPosition],
    }
    currentPositionIndex.value = 0
  }

  // Check if we can undo
  const canUndo = computed(() => currentPositionIndex.value > 0)

  // Check if we can redo
  const canRedo = computed(() => currentPositionIndex.value < history.value.positions.length - 1)

  // Get current move number
  const currentMoveNumber = computed(() => Math.floor((currentPositionIndex.value + 1) / 2))

  return {
    history,
    currentPositionIndex,
    moveNotations,
    addMove,
    goToPosition,
    undoMove,
    redoMove,
    resetHistory,
    canUndo,
    canRedo,
    currentMoveNumber,
  }
}
