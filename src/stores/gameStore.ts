import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Piece,
  PieceColor,
  Square,
  GameStatus,
  ValidationResult,
  ValidationFeedbackType,
  Move,
} from '../types'
import { INITIAL_POSITION } from '../constants/pieceConfig'
import { INITIAL_GAME_CONFIG, STATUS_MESSAGES } from '../constants/gameConfig'
import { VALIDATION_MESSAGES } from '../constants/validationConfig'
import { useChessRules } from '../composables/useChessRules'
import { generateMoveNotation } from '../utils/notationUtils'
import {
  CHECKMATE_POSITION,
  STALEMATE_POSITION,
  ONE_MOVE_CHECKMATE,
  ALMOST_STALEMATE,
  CAPTURE_TEST_POSITION,
} from '../constants/debugPositions'

export const useGameStore = defineStore('game', () => {
  // Game state
  const pieces = ref<Piece[]>([...INITIAL_POSITION])
  const currentTurn = ref<PieceColor>('white')
  const selectedPieceId = ref<string | null>(null)
  const status = ref<GameStatus>('idle') // Start with idle status
  const availableMoves = ref<Move[]>([])
  const config = ref({ ...INITIAL_GAME_CONFIG })
  const check = ref({
    inCheck: false,
    kingId: null as string | null,
  })
  const history = ref({
    moves: [] as Move[],
    positions: [[...INITIAL_POSITION]] as Piece[][],
    currentIndex: 0, // Track current position in history for redo functionality
  })
  const lastValidation = ref<ValidationResult>({
    valid: true,
    feedbackType: 'none',
    reason: '',
  })
  const lastFeedbackSquare = ref<Square | null>(null)

  // Computed properties
  const statusMessage = computed(() => STATUS_MESSAGES[status.value])
  const whoseTurn = computed(() => currentTurn.value)
  const selectedPiece = computed(() =>
    pieces.value.find((piece) => piece.id === selectedPieceId.value),
  )
  const canUndo = computed(() => history.value.currentIndex > 0)
  const canRedo = computed(() => history.value.currentIndex < history.value.positions.length - 1)
  const gameStarted = computed(() => status.value !== 'idle')
  const activeMoves = computed(() => {
    return history.value.moves.slice(0, history.value.currentIndex)
  })

  // Helper functions
  function getRules() {
    return useChessRules(pieces.value)
  }

  function getPieceAtSquare(square: Square): Piece | undefined {
    return getRules().getPieceAtSquare(square)
  }

  function generateMovesForPiece(piece: Piece): Move[] {
    return getRules().generateMovesForPiece(piece)
  }

  // Game actions
  function startNewGame() {
    pieces.value = [...INITIAL_POSITION]
    currentTurn.value = 'white'
    selectedPieceId.value = null
    status.value = 'active' // Now set to active when game starts
    check.value = { inCheck: false, kingId: null }
    availableMoves.value = []

    // Reset history
    history.value = {
      moves: [],
      positions: [[...INITIAL_POSITION]],
      currentIndex: 0,
    }

    // Clear validation feedback
    clearValidationFeedback()
  }

  function selectPiece(pieceId: string | null) {
    // Clear validation feedback first
    clearValidationFeedback()

    // If no piece is selected, clear the state
    if (pieceId === null) {
      selectedPieceId.value = null
      availableMoves.value = []
      return
    }

    // Only proceed if the game is active
    if (status.value !== 'active') {
      return
    }

    // Find the piece
    const piece = pieces.value.find((p) => p.id === pieceId)

    // Check if it's the player's turn
    if (!piece || piece.color !== currentTurn.value) {
      selectedPieceId.value = null
      availableMoves.value = []
      return
    }

    // Select the piece
    selectedPieceId.value = pieceId

    // Generate available moves for the selected piece
    const rules = getRules()
    const moves = rules.generateMovesForPiece(piece)

    // Log moves for debugging
    console.log(
      `Generated moves for ${piece.type} at ${piece.square}:`,
      moves.map((m) => ({
        to: m.to,
        type: m.type,
        capturedPiece: m.capturedPiece
          ? `${m.capturedPiece.color} ${m.capturedPiece.type}`
          : 'none',
      })),
    )

    // Specifically log capture moves if any
    const captureMoves = moves.filter((m) => m.type === 'capture')
    if (captureMoves.length > 0) {
      console.log(
        'CAPTURE MOVES AVAILABLE:',
        captureMoves.map((m) => ({
          to: m.to,
          capturedPiece: m.capturedPiece
            ? `${m.capturedPiece.color} ${m.capturedPiece.type}`
            : 'none',
        })),
      )
    }

    availableMoves.value = moves
  }

  function isValidMoveTarget(square: Square): boolean {
    // If no piece is selected, no valid targets
    if (!selectedPieceId.value) return false

    // Find the selected piece
    const selectedPiece = pieces.value.find((p) => p.id === selectedPieceId.value)
    if (!selectedPiece) return false

    // Check if this square is in the available moves for the selected piece
    const validMove = availableMoves.value.find((move) => move.to === square)
    const isValid = !!validMove

    // Debug logging
    console.log(`isValidMoveTarget check for ${square}:`, {
      pieceId: selectedPieceId.value,
      from: selectedPiece.square,
      availableMoves: availableMoves.value.map((m) => m.to),
      validMove,
      isValid,
    })

    // Log additional info if there's a piece at the target
    const pieceAtTarget = getPieceAtSquare(square)
    if (pieceAtTarget) {
      const isEnemyPiece = pieceAtTarget.color !== currentTurn.value
      console.log(
        `Target ${square} has ${isEnemyPiece ? 'enemy' : 'friendly'} ${pieceAtTarget.type}`,
        {
          validCapture: isValid && isEnemyPiece,
        },
      )
    }

    return isValid
  }

  function validateMove(from: Square, to: Square): ValidationResult {
    // Always get fresh rules with current pieces
    const rules = getRules()

    // Game must be active
    if (status.value !== 'active') {
      const result = {
        valid: false,
        reason: VALIDATION_MESSAGES.gameNotActive,
        feedbackType: 'info' as ValidationFeedbackType,
      }
      lastValidation.value = result
      lastFeedbackSquare.value = from
      return result
    }

    // Must have a piece at the from square
    const piece = rules.getPieceAtSquare(from)
    if (!piece) {
      const result = {
        valid: false,
        reason: VALIDATION_MESSAGES.noPieceSelected,
        feedbackType: 'info' as ValidationFeedbackType,
      }
      lastValidation.value = result
      lastFeedbackSquare.value = from
      return result
    }

    // Must be the player's turn
    if (piece.color !== currentTurn.value) {
      const result = {
        valid: false,
        reason: VALIDATION_MESSAGES.notYourTurn,
        feedbackType: 'error' as ValidationFeedbackType,
      }
      lastValidation.value = result
      lastFeedbackSquare.value = from
      return result
    }

    // Check if the move is valid according to piece rules
    const possibleMoves = rules.generateMovesForPiece(piece)
    const isValidPieceMove = possibleMoves.some((move) => move.to === to)

    if (!isValidPieceMove) {
      const result = {
        valid: false,
        reason: VALIDATION_MESSAGES.invalidPieceMove,
        feedbackType: 'error' as ValidationFeedbackType,
      }
      lastValidation.value = result
      lastFeedbackSquare.value = from
      return result
    }

    // Move is valid
    const result = {
      valid: true,
      feedbackType: 'success' as ValidationFeedbackType,
    }
    lastValidation.value = result
    lastFeedbackSquare.value = to
    return result
  }

  function movePiece(from: Square, to: Square): boolean {
    // Validate the move
    const rules = getRules()
    const validation = validateMove(from, to)

    // If not valid, return false
    if (!validation.valid) {
      return false
    }

    // Find the move
    const move = rules.findMove(from, to)
    if (!move) return false

    // Execute the move
    executeMove(move)

    // Clear validation feedback
    clearValidationFeedback()

    // Update game status after the move
    updateGameStatus()

    return true
  }

  function executeMove(move: Move) {
    const { piece, to, type, capturedPiece, promotionPiece } = move

    // Create a new array with updated piece positions
    const newPieces = pieces.value
      .filter((p) => {
        // Remove captured piece if any
        if (capturedPiece && p.id === capturedPiece.id) return false
        return true
      })
      .map((p) => {
        // Update the moved piece
        if (p.id === piece.id) {
          if (type === 'promotion' && promotionPiece) {
            // Change the piece type for promotion
            return { ...p, square: to, type: promotionPiece, hasMoved: true }
          } else {
            // Regular move
            return { ...p, square: to, hasMoved: true }
          }
        }
        return p
      })

    // Update the pieces
    pieces.value = [...newPieces]

    // Switch turns
    currentTurn.value = currentTurn.value === 'white' ? 'black' : 'white'

    // Update game status to detect check/checkmate
    updateGameStatus()

    // Update notation with check/checkmate status
    move.notation = generateMoveNotation(move, pieces.value, status.value)

    // Add to history (remove any future positions if we're redoing from a previous position)
    addMove(move, newPieces)

    // Clear selection
    selectedPieceId.value = null
    availableMoves.value = []
  }

  function addMove(move: Move, newPosition: Piece[]) {
    // If we're not at the end of history, truncate it
    if (history.value.currentIndex < history.value.positions.length - 1) {
      history.value.moves = history.value.moves.slice(0, history.value.currentIndex)
      history.value.positions = history.value.positions.slice(0, history.value.currentIndex + 1)
    }

    // Add the new move and position
    history.value.moves.push(move)
    history.value.positions.push([...newPosition])
    history.value.currentIndex++
  }

  function handleUndoMove() {
    if (canUndo.value) {
      // Decrease the current index
      history.value.currentIndex--

      // Get the previous position
      const previousPosition = history.value.positions[history.value.currentIndex]

      // Update the pieces
      pieces.value = [...previousPosition]

      // Switch turns
      currentTurn.value = currentTurn.value === 'white' ? 'black' : 'white'

      // Clear selection
      selectedPieceId.value = null
      availableMoves.value = []

      // Clear validation feedback
      clearValidationFeedback()

      // Update game status
      updateGameStatus()
    }
  }

  function handleRedoMove() {
    if (canRedo.value) {
      // Get the move we're redoing
      const move = history.value.moves[history.value.currentIndex]

      // Increase the current index
      history.value.currentIndex++

      // Get the next position
      const nextPosition = history.value.positions[history.value.currentIndex]

      // Update the pieces
      pieces.value = [...nextPosition]

      // Switch turns
      currentTurn.value = currentTurn.value === 'white' ? 'black' : 'white'

      // Clear selection
      selectedPieceId.value = null
      availableMoves.value = []

      // Clear validation feedback
      clearValidationFeedback()

      // Update game status
      updateGameStatus()

      // Update the move notation to reflect the current game state (check/checkmate)
      if (move) {
        move.notation = generateMoveNotation(move, pieces.value, status.value)
      }
    }
  }

  function clearValidationFeedback() {
    lastValidation.value = {
      valid: true,
      feedbackType: 'none',
      reason: '',
    }
    lastFeedbackSquare.value = null
  }

  function updateGameStatus() {
    // Update based on check/checkmate/stalemate status
    const rules = getRules()
    const kingInCheck = rules.isKingInCheck(currentTurn.value)

    if (kingInCheck) {
      const king = rules.getKing(currentTurn.value)
      check.value = {
        inCheck: true,
        kingId: king ? king.id : null,
      }

      // Check for checkmate
      const availableMoves = rules.getLegalMovesForColor(currentTurn.value)
      const hasLegalMoves = availableMoves.length > 0

      if (!hasLegalMoves) {
        status.value = 'checkmate'
      } else {
        status.value = 'check'
      }
    } else {
      check.value = {
        inCheck: false,
        kingId: null,
      }

      // Check for stalemate
      const availableMoves = rules.getLegalMovesForColor(currentTurn.value)
      const hasLegalMoves = availableMoves.length > 0

      if (!hasLegalMoves) {
        status.value = 'stalemate'
      } else {
        status.value = 'active'
      }
    }
  }

  function handleSquareClick(square: Square) {
    // If game is not active, do nothing
    if (status.value !== 'active') return

    // Get pieces at source and target
    const targetPiece = getPieceAtSquare(square)

    // If we have a selected piece
    if (selectedPieceId.value) {
      const selectedPiece = pieces.value.find((p) => p.id === selectedPieceId.value)
      if (!selectedPiece) {
        // Invalid selection state, reset
        selectedPieceId.value = null
        return
      }

      // Clicking the same piece again deselects it
      if (selectedPiece.square === square) {
        selectedPieceId.value = null
        return
      }

      // Case: Attempting to capture an enemy piece
      if (targetPiece && targetPiece.color !== currentTurn.value) {
        console.log('Store: Attempting to capture:', { from: selectedPiece.square, to: square })

        // Check if this is a valid move target
        if (isValidMoveTarget(square)) {
          console.log('Store: Valid capture move detected')
          // Use the movePiece function which handles captures
          movePiece(selectedPiece.square, square)
        } else {
          console.log('Store: Invalid capture attempt - not a valid move target')
        }
        return
      }

      // If clicking another own piece, select it
      if (targetPiece && targetPiece.color === currentTurn.value) {
        selectPiece(targetPiece.id)
        return
      }

      // If clicking an empty square and it's a valid move target
      if (!targetPiece && isValidMoveTarget(square)) {
        movePiece(selectedPiece.square, square)
        return
      }

      // Otherwise deselect
      selectedPieceId.value = null
    } else {
      // No piece selected, try to select one if it's the player's piece
      if (targetPiece && targetPiece.color === currentTurn.value) {
        selectPiece(targetPiece.id)
      }
    }
  }

  // Debug functions for testing game states
  function loadDebugPosition(
    positionType: 'checkmate' | 'stalemate' | 'oneMove' | 'almostStalemate' | 'captureTest',
  ) {
    // Make sure the game is active first
    if (status.value === 'idle') {
      status.value = 'active'
    }

    // Load the requested position
    switch (positionType) {
      case 'checkmate':
        pieces.value = [...CHECKMATE_POSITION]
        currentTurn.value = 'black' // Black is in checkmate
        break
      case 'stalemate':
        pieces.value = [...STALEMATE_POSITION]
        currentTurn.value = 'black' // Black is in stalemate
        break
      case 'oneMove':
        pieces.value = [...ONE_MOVE_CHECKMATE]
        currentTurn.value = 'white' // White to move and deliver checkmate
        break
      case 'almostStalemate':
        pieces.value = [...ALMOST_STALEMATE]
        currentTurn.value = 'white' // White to move to cause stalemate
        break
      case 'captureTest':
        pieces.value = [...CAPTURE_TEST_POSITION]
        currentTurn.value = 'white' // White to move and capture
        break
    }

    // Reset other game state
    selectedPieceId.value = null
    availableMoves.value = []

    // Update game status
    updateGameStatus()

    // Reset history with this as the starting position
    history.value = {
      moves: [],
      positions: [[...pieces.value]],
      currentIndex: 0,
    }

    // Clear validation feedback
    clearValidationFeedback()
  }

  return {
    // State
    pieces,
    currentTurn,
    selectedPieceId,
    status,
    availableMoves,
    config,
    check,
    history,
    lastValidation,
    lastFeedbackSquare,

    // Getters
    statusMessage,
    whoseTurn,
    selectedPiece,
    canUndo,
    canRedo,
    gameStarted,
    activeMoves,

    // Actions
    startNewGame,
    selectPiece,
    isValidMoveTarget,
    movePiece,
    handleUndoMove,
    handleRedoMove,
    handleSquareClick,
    clearValidationFeedback,

    // Add this helper function to the exported object
    getRules,

    // Debug functions
    loadDebugPosition,
  }
})
