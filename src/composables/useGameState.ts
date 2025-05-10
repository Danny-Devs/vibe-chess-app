import { ref, reactive, computed } from 'vue'
import type {
  GameState,
  Piece,
  PieceColor,
  Square,
  Move,
  GameStatus,
  ValidationResult,
  ValidationFeedbackType,
} from '../types'
import { INITIAL_POSITION } from '../constants/pieceConfig'
import { INITIAL_GAME_CONFIG, STATUS_MESSAGES } from '../constants/gameConfig'
import { VALIDATION_MESSAGES } from '../constants/validationConfig'
import { useChessRules } from './useChessRules'
import { useGameHistory } from './useGameHistory'

export function useGameState() {
  // Initialize the game state
  const gameState = reactive<GameState>({
    pieces: [...INITIAL_POSITION],
    currentTurn: 'white',
    selectedPieceId: null,
    status: 'idle',
    check: {
      inCheck: false,
      kingId: null,
    },
    history: {
      moves: [],
      positions: [[...INITIAL_POSITION]],
    },
    availableMoves: [],
    config: { ...INITIAL_GAME_CONFIG },
  })

  // Set up chess rules
  const getRules = () => useChessRules(gameState.pieces)

  // Shorthand for accessing rules
  const getPieceAtSquare = (square: Square): Piece | undefined => {
    return useChessRules(gameState.pieces).getPieceAtSquare(square)
  }

  // Generate moves for a piece
  const generateMovesForPiece = (piece: Piece): Move[] => {
    return useChessRules(gameState.pieces).generateMovesForPiece(piece)
  }

  // Find a move
  const findMove = (from: Square, to: Square): Move | undefined => {
    return useChessRules(gameState.pieces).findMove(from, to)
  }

  // Set up game history
  const { addMove, undoMove, redoMove, resetHistory, canUndo, canRedo } = useGameHistory()

  // Validation feedback state
  const lastValidation = ref<ValidationResult>({
    valid: true,
    feedbackType: 'none',
    reason: '',
  })

  const lastFeedbackSquare = ref<Square | null>(null)

  // Get current status message
  const statusMessage = computed(() => {
    return STATUS_MESSAGES[gameState.status]
  })

  // Start a new game
  const startNewGame = () => {
    gameState.pieces = [...INITIAL_POSITION]
    gameState.currentTurn = 'white'
    gameState.selectedPieceId = null
    gameState.status = 'ready'
    gameState.check = { inCheck: false, kingId: null }
    gameState.availableMoves = []

    // Reset history
    resetHistory([...INITIAL_POSITION])

    // Clear any validation feedback
    clearValidationFeedback()

    // Start the game
    gameState.status = 'active'
  }

  // Clear validation feedback
  const clearValidationFeedback = () => {
    lastValidation.value = {
      valid: true,
      feedbackType: 'none',
      reason: '',
    }
    lastFeedbackSquare.value = null
  }

  // Check if a square has feedback
  const hasFeedback = (square: Square): boolean => {
    return lastFeedbackSquare.value === square && lastValidation.value.feedbackType !== 'none'
  }

  // Get feedback type for a square
  const getFeedbackType = (square: Square): ValidationFeedbackType => {
    if (hasFeedback(square)) {
      return lastValidation.value.feedbackType
    }
    return 'none'
  }

  // Validate a move
  const validateMove = (from: Square, to: Square): ValidationResult => {
    // Always get fresh rules with the current pieces
    const rules = useChessRules(gameState.pieces)

    // Game must be active
    if (gameState.status !== 'active') {
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
    if (piece.color !== gameState.currentTurn) {
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

    // Check if the move would result in check
    if (rules.isKingInCheck(piece.color)) {
      // King is already in check, must get out of check
      if (rules.wouldResultInCheck(from, to, piece.color)) {
        const result = {
          valid: false,
          reason: VALIDATION_MESSAGES.kingInCheck,
          feedbackType: 'error' as ValidationFeedbackType,
        }
        lastValidation.value = result
        lastFeedbackSquare.value = to
        return result
      }
    } else {
      // King is not in check, cannot move into check
      if (rules.wouldResultInCheck(from, to, piece.color)) {
        const result = {
          valid: false,
          reason: VALIDATION_MESSAGES.movingIntoCheck,
          feedbackType: 'error' as ValidationFeedbackType,
        }
        lastValidation.value = result
        lastFeedbackSquare.value = to
        return result
      }
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

  // Select a piece
  const selectPiece = (pieceId: string | null) => {
    // Can only select pieces of current player's color during active game
    if (pieceId !== null && gameState.status === 'active') {
      const piece = gameState.pieces.find((p) => p.id === pieceId)
      if (piece && piece.color === gameState.currentTurn) {
        gameState.selectedPieceId = pieceId
        gameState.availableMoves = generateMovesForPiece(piece)
      }
    } else {
      gameState.selectedPieceId = null
      gameState.availableMoves = []
    }

    // Clear validation feedback when selecting a piece
    clearValidationFeedback()
  }

  // Move a piece
  const movePiece = (from: Square, to: Square): boolean => {
    // Validate the move with fresh rules
    const rules = useChessRules(gameState.pieces)
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

  // Execute a move and update the game state
  const executeMove = (move: Move) => {
    const { piece, to, type, capturedPiece, promotionPiece } = move

    // Create a new array with updated piece positions
    const newPieces = gameState.pieces
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

    // Update the game state with the new pieces
    gameState.pieces = [...newPieces]

    // Add to history
    addMove(move, newPieces)

    // Clear selection
    gameState.selectedPieceId = null
    gameState.availableMoves = []

    // Switch turns
    gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white'
  }

  // Check for check
  const checkForCheck = () => {
    const rules = useChessRules(gameState.pieces)
    const kingInCheck = rules.isKingInCheck(gameState.currentTurn)

    if (kingInCheck) {
      const king = rules.getKing(gameState.currentTurn)
      gameState.check = {
        inCheck: true,
        kingId: king ? king.id : null,
      }

      // Check for checkmate or stalemate
      const availableMoves = rules.getLegalMovesForColor(gameState.currentTurn)
      const hasLegalMoves = availableMoves.length > 0

      if (!hasLegalMoves) {
        gameState.status = 'checkmate'
      } else {
        gameState.status = 'check'
      }
    } else {
      gameState.check = {
        inCheck: false,
        kingId: null,
      }

      // Check for stalemate
      const availableMoves = rules.getLegalMovesForColor(gameState.currentTurn)
      const hasLegalMoves = availableMoves.length > 0

      if (!hasLegalMoves) {
        gameState.status = 'stalemate'
      } else {
        gameState.status = 'active'
      }
    }
  }

  // Update the game status
  const updateGameStatus = () => {
    checkForCheck()
  }

  // Undo the last move
  const handleUndoMove = () => {
    if (canUndo.value) {
      const previousPosition = undoMove()
      if (previousPosition.length > 0) {
        gameState.pieces = previousPosition
        gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white'
        gameState.selectedPieceId = null
        gameState.availableMoves = []
        clearValidationFeedback()
        updateGameStatus()
      }
    }
  }

  // Redo the last undone move
  const handleRedoMove = () => {
    if (canRedo.value) {
      const nextPosition = redoMove()
      if (nextPosition.length > 0) {
        gameState.pieces = nextPosition
        gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white'
        gameState.selectedPieceId = null
        gameState.availableMoves = []
        clearValidationFeedback()
        updateGameStatus()
      }
    }
  }

  // Check if a square is a valid move target
  const isValidMoveTarget = (square: Square): boolean => {
    if (!gameState.selectedPieceId) return false

    const selectedPiece = gameState.pieces.find((p) => p.id === gameState.selectedPieceId)
    if (!selectedPiece) return false

    return gameState.availableMoves.some((move) => move.to === square)
  }

  // Handle square click
  const handleSquareClick = (square: Square) => {
    // Get fresh rules
    const rules = useChessRules(gameState.pieces)

    // If a piece is already selected
    if (gameState.selectedPieceId) {
      const selectedPiece = gameState.pieces.find((p) => p.id === gameState.selectedPieceId)

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
      const clickedPiece = rules.getPieceAtSquare(square)
      if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
        selectPiece(clickedPiece.id)
        return
      }

      // Otherwise, deselect the current piece
      selectPiece(null)
    } else {
      // If no piece is selected, try to select the piece at the clicked square
      const clickedPiece = rules.getPieceAtSquare(square)
      if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
        selectPiece(clickedPiece.id)
      }
    }
  }

  // Toggle board orientation
  const toggleBoardOrientation = () => {
    gameState.config.flipped = !gameState.config.flipped
  }

  // Toggle showing available moves
  const toggleShowAvailableMoves = () => {
    gameState.config.showAvailableMoves = !gameState.config.showAvailableMoves
  }

  // Toggle auto queen promotion
  const toggleAutoQueen = () => {
    gameState.config.autoQueen = !gameState.config.autoQueen
  }

  return {
    gameState,
    statusMessage,
    startNewGame,
    selectPiece,
    movePiece,
    handleUndoMove,
    handleRedoMove,
    isValidMoveTarget,
    handleSquareClick,
    toggleBoardOrientation,
    toggleShowAvailableMoves,
    toggleAutoQueen,
    validateMove,
    clearValidationFeedback,
    hasFeedback,
    getFeedbackType,
    lastValidation,
  }
}
