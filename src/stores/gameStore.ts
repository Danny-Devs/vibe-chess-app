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

    // Can only select pieces of the current player's color during active game
    if (pieceId !== null && status.value === 'active') {
      const piece = pieces.value.find((p) => p.id === pieceId)
      if (piece && piece.color === currentTurn.value) {
        selectedPieceId.value = pieceId
        // Generate available moves for the selected piece
        availableMoves.value = generateMovesForPiece(piece)
      } else {
        // If piece is null or not the current player's color, clear selection
        selectedPieceId.value = null
        availableMoves.value = []
      }
    } else {
      // Clear selection
      selectedPieceId.value = null
      availableMoves.value = []
    }
  }

  function isValidMoveTarget(square: Square): boolean {
    if (!selectedPieceId.value) return false

    const selectedPiece = pieces.value.find((p) => p.id === selectedPieceId.value)
    if (!selectedPiece) return false

    // Check if this square is in the available moves for the selected piece
    const isValid = availableMoves.value.some((move) => move.to === square)

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

    // If a piece is already selected
    if (selectedPieceId.value) {
      const selectedPiece = pieces.value.find((p) => p.id === selectedPieceId.value)

      // If clicking on the same piece, deselect it
      if (selectedPiece && selectedPiece.square === square) {
        selectPiece(null)
        return
      }

      // If clicking on a valid target square, move the piece
      if (selectedPiece && isValidMoveTarget(square)) {
        movePiece(selectedPiece.square, square)
        return
      }

      // If clicking on another piece of the same color, select it instead
      const clickedPiece = getPieceAtSquare(square)
      if (clickedPiece && clickedPiece.color === currentTurn.value) {
        selectPiece(clickedPiece.id)
        return
      }

      // Otherwise, deselect the current piece
      selectPiece(null)
    } else {
      // If no piece is selected, try to select the piece at the clicked square
      const clickedPiece = getPieceAtSquare(square)
      if (clickedPiece && clickedPiece.color === currentTurn.value) {
        selectPiece(clickedPiece.id)
      }
    }
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
  }
})
