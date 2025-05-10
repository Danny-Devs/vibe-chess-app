import { ref, computed, watch } from 'vue'
import type {
  Square,
  Piece,
  Move,
  ValidationResult,
  ValidationFeedbackType,
  PieceColor,
} from '../types'
import { VALIDATION_MESSAGES } from '../constants/validationConfig'
import { useChessRules } from './useChessRules'

export function useValidation(pieces: Piece[], currentTurn: PieceColor, gameActive: boolean) {
  // Get chess rules (this will need to be updated when pieces change)
  const getPieceAtSquare = (square: Square): Piece | undefined => {
    return pieces.find((piece) => piece.square === square)
  }

  const getChessRules = () => useChessRules(pieces)

  // Store last validation result for UI feedback
  const lastValidation = ref<ValidationResult>({
    valid: true,
    feedbackType: 'none',
  })

  // Track square that received last feedback
  const lastFeedbackSquare = ref<Square | null>(null)

  // Basic validation: check if a move is valid based on piece movement patterns
  const validateBasicMove = (from: Square, to: Square): ValidationResult => {
    const rules = getChessRules()

    // Game must be active
    if (!gameActive) {
      return {
        valid: false,
        reason: VALIDATION_MESSAGES.gameNotActive,
        feedbackType: 'info',
      }
    }

    // Must have a piece at the from square
    const piece = rules.getPieceAtSquare(from)
    if (!piece) {
      return {
        valid: false,
        reason: VALIDATION_MESSAGES.noPieceSelected,
        feedbackType: 'info',
      }
    }

    // Must be the player's turn
    if (piece.color !== currentTurn) {
      return {
        valid: false,
        reason: VALIDATION_MESSAGES.notYourTurn,
        feedbackType: 'error',
      }
    }

    // Generate all possible moves for the piece
    const possibleMoves = rules.generateMovesForPiece(piece)

    // Check if the target square is in the list of possible moves
    const isValid = possibleMoves.some((move) => move.to === to)

    if (!isValid) {
      return {
        valid: false,
        reason: VALIDATION_MESSAGES.invalidPieceMove,
        feedbackType: 'error',
      }
    }

    // If we got here, the move is valid according to basic piece movement rules
    return {
      valid: true,
      feedbackType: 'success',
    }
  }

  // Advanced validation: check if the move would result in check
  const validateCheck = (from: Square, to: Square, color: PieceColor): ValidationResult => {
    const rules = getChessRules()

    // Check if the king is already in check
    if (rules.isKingInCheck(color)) {
      // If the king is in check, the move must get the king out of check
      if (rules.wouldResultInCheck(from, to, color)) {
        return {
          valid: false,
          reason: VALIDATION_MESSAGES.kingInCheck,
          feedbackType: 'error',
        }
      }
    } else {
      // If the king is not in check, the move must not put the king in check
      if (rules.wouldResultInCheck(from, to, color)) {
        return {
          valid: false,
          reason: VALIDATION_MESSAGES.movingIntoCheck,
          feedbackType: 'error',
        }
      }
    }

    // If we got here, the move is valid from a check perspective
    return {
      valid: true,
      feedbackType: 'success',
    }
  }

  // Combine all validations
  const validateMove = (from: Square, to: Square): ValidationResult => {
    // First perform basic validation
    const basicValidation = validateBasicMove(from, to)
    if (!basicValidation.valid) {
      lastValidation.value = basicValidation
      lastFeedbackSquare.value = from // Feedback on the from square
      return basicValidation
    }

    // Then check for check-related issues
    const rules = getChessRules()
    const piece = rules.getPieceAtSquare(from)!
    const checkValidation = validateCheck(from, to, piece.color)
    if (!checkValidation.valid) {
      lastValidation.value = checkValidation
      lastFeedbackSquare.value = to // Feedback on the to square
      return checkValidation
    }

    // If all validations pass
    lastValidation.value = {
      valid: true,
      feedbackType: 'success',
    }
    lastFeedbackSquare.value = to

    return lastValidation.value
  }

  // Clear validation feedback
  const clearValidationFeedback = () => {
    lastValidation.value = {
      valid: true,
      feedbackType: 'none',
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

  return {
    validateMove,
    clearValidationFeedback,
    lastValidation,
    lastFeedbackSquare,
    hasFeedback,
    getFeedbackType,
  }
}
