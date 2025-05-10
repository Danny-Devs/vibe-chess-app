import type { ValidationFeedbackType } from '../types'

// Feedback colors for different validation states
export const FEEDBACK_COLORS = {
  none: 'transparent',
  success: 'rgba(100, 255, 100, 0.4)',
  error: 'rgba(255, 100, 100, 0.4)',
  warning: 'rgba(255, 200, 100, 0.4)',
  info: 'rgba(100, 200, 255, 0.4)',
}

// Feedback messages for different validation errors
export const VALIDATION_MESSAGES = {
  notYourTurn: 'Not your turn',
  wrongPieceColor: "You cannot move your opponent's pieces",
  kingInCheck: 'Your king is in check',
  movingIntoCheck: 'This move would put your king in check',
  invalidPieceMove: 'This piece cannot move that way',
  pieceBlocked: 'The path is blocked by another piece',
  noPieceSelected: 'Select a piece first',
  gameNotActive: 'The game is not active',
}

// Animation durations for feedback
export const FEEDBACK_ANIMATION = {
  duration: 300, // ms
  shake: {
    duration: 400,
    intensity: 5,
  },
}
