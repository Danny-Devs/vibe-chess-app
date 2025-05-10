import { computed } from 'vue'
import type { Piece, PieceColor, PieceType, Square, Move, MoveType, Direction } from '../types'
import { DIRECTION_VECTORS } from '../constants/gameConfig'
import { indicesToSquare, squareToIndices, generateMoveNotation } from '../utils/notationUtils'

export function useChessRules(pieces: Piece[]) {
  // Find a piece at a specific square
  const getPieceAtSquare = (square: Square): Piece | undefined => {
    return pieces.find((piece) => piece.square === square)
  }

  // Check if a square is empty
  const isSquareEmpty = (square: Square): boolean => {
    return !getPieceAtSquare(square)
  }

  // Check if a square has an enemy piece
  const hasEnemyPiece = (square: Square, color: PieceColor): boolean => {
    const piece = getPieceAtSquare(square)
    return !!piece && piece.color !== color
  }

  // Get the king of a specific color
  const getKing = (color: PieceColor): Piece | undefined => {
    return pieces.find((piece) => piece.type === 'king' && piece.color === color)
  }

  // Generate all possible moves for a piece
  const generateMovesForPiece = (piece: Piece): Move[] => {
    if (!piece) return []

    const moves: Move[] = []
    const [fileIndex, rankIndex] = squareToIndices(piece.square)

    switch (piece.type) {
      case 'pawn':
        generatePawnMoves(piece, fileIndex, rankIndex, moves)
        break

      case 'rook':
      case 'bishop':
      case 'queen':
        generateSlidingMoves(piece, fileIndex, rankIndex, moves)
        break

      case 'knight':
        generateKnightMoves(piece, fileIndex, rankIndex, moves)
        break

      case 'king':
        generateKingMoves(piece, fileIndex, rankIndex, moves)
        break
    }

    return moves
  }

  // Generate pawn moves
  const generatePawnMoves = (piece: Piece, fileIndex: number, rankIndex: number, moves: Move[]) => {
    const directions = DIRECTION_VECTORS.pawn[piece.color]
    const startingRank = piece.color === 'white' ? '2' : '7'
    const promotionRank = piece.color === 'white' ? '1' : '8'

    // Forward moves
    const forwardDir = directions[0]
    const newFileIndex = fileIndex + forwardDir[0]
    const newRankIndex = rankIndex + forwardDir[1]

    const forwardSquare = indicesToSquare(newFileIndex, newRankIndex)

    if (forwardSquare && isSquareEmpty(forwardSquare)) {
      // Check for promotion
      if (forwardSquare.charAt(1) === promotionRank) {
        addPawnPromotionMoves(piece, piece.square, forwardSquare, moves)
      } else {
        // Regular forward move
        moves.push({
          piece,
          from: piece.square,
          to: forwardSquare,
          type: 'normal',
          notation: generateMoveNotation(
            {
              piece,
              from: piece.square,
              to: forwardSquare,
              type: 'normal',
            } as Move,
            pieces,
          ),
        })
      }

      // Double forward move from starting position
      if (piece.square.charAt(1) === startingRank) {
        const doubleForwardDir = directions[1]
        const doubleFileIndex = fileIndex + doubleForwardDir[0]
        const doubleRankIndex = rankIndex + doubleForwardDir[1]
        const doubleSquare = indicesToSquare(doubleFileIndex, doubleRankIndex)

        if (doubleSquare && isSquareEmpty(doubleSquare)) {
          moves.push({
            piece,
            from: piece.square,
            to: doubleSquare,
            type: 'normal',
            notation: generateMoveNotation(
              {
                piece,
                from: piece.square,
                to: doubleSquare,
                type: 'normal',
              } as Move,
              pieces,
            ),
          })
        }
      }
    }

    // Capture moves
    const captureDirections = [directions[2], directions[3]]

    for (const dir of captureDirections) {
      const captureFileIndex = fileIndex + dir[0]
      const captureRankIndex = rankIndex + dir[1]
      const captureSquare = indicesToSquare(captureFileIndex, captureRankIndex)

      if (captureSquare && hasEnemyPiece(captureSquare, piece.color)) {
        const capturedPiece = getPieceAtSquare(captureSquare)

        // Check for promotion
        if (captureSquare.charAt(1) === promotionRank) {
          addPawnPromotionMoves(piece, piece.square, captureSquare, moves, capturedPiece)
        } else {
          // Regular capture
          moves.push({
            piece,
            from: piece.square,
            to: captureSquare,
            type: 'capture',
            capturedPiece,
            notation: generateMoveNotation(
              {
                piece,
                from: piece.square,
                to: captureSquare,
                type: 'capture',
                capturedPiece,
              } as Move,
              pieces,
            ),
          })
        }
      }

      // TODO: En passant will be implemented in Feature 8 (Advanced Chess Rules)
    }
  }

  // Helper for adding pawn promotion moves
  const addPawnPromotionMoves = (
    piece: Piece,
    from: Square,
    to: Square,
    moves: Move[],
    capturedPiece?: Piece,
  ) => {
    const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight']
    const moveType: MoveType = capturedPiece ? 'capture' : 'normal'

    for (const promotionPiece of promotionPieces) {
      moves.push({
        piece,
        from,
        to,
        type: 'promotion',
        capturedPiece,
        promotionPiece,
        notation: generateMoveNotation(
          {
            piece,
            from,
            to,
            type: 'promotion',
            capturedPiece,
            promotionPiece,
          } as Move,
          pieces,
        ),
      })
    }
  }

  // Generate sliding moves (rook, bishop, queen)
  const generateSlidingMoves = (
    piece: Piece,
    fileIndex: number,
    rankIndex: number,
    moves: Move[],
  ) => {
    let directions: Direction[] = []

    // Get the appropriate direction vectors based on piece type
    if (piece.type === 'rook') {
      directions = DIRECTION_VECTORS.rook
    } else if (piece.type === 'bishop') {
      directions = DIRECTION_VECTORS.bishop
    } else if (piece.type === 'queen') {
      directions = DIRECTION_VECTORS.queen
    }

    // Check each direction
    for (const dir of directions) {
      let newFileIndex = fileIndex
      let newRankIndex = rankIndex

      // Continue sliding until hitting edge of board, friendly piece, or capturing enemy piece
      while (true) {
        newFileIndex += dir[0]
        newRankIndex += dir[1]

        const newSquare = indicesToSquare(newFileIndex, newRankIndex)

        // Stop if we've moved off the board
        if (!newSquare) break

        // Check if square has a piece
        const pieceAtSquare = getPieceAtSquare(newSquare)

        if (!pieceAtSquare) {
          // Empty square - add normal move
          moves.push({
            piece,
            from: piece.square,
            to: newSquare,
            type: 'normal',
            notation: generateMoveNotation(
              {
                piece,
                from: piece.square,
                to: newSquare,
                type: 'normal',
              } as Move,
              pieces,
            ),
          })
        } else if (pieceAtSquare.color !== piece.color) {
          // Enemy piece - add capture and stop sliding
          moves.push({
            piece,
            from: piece.square,
            to: newSquare,
            type: 'capture',
            capturedPiece: pieceAtSquare,
            notation: generateMoveNotation(
              {
                piece,
                from: piece.square,
                to: newSquare,
                type: 'capture',
                capturedPiece: pieceAtSquare,
              } as Move,
              pieces,
            ),
          })
          break
        } else {
          // Friendly piece - stop sliding
          break
        }
      }
    }
  }

  // Generate knight moves
  const generateKnightMoves = (
    piece: Piece,
    fileIndex: number,
    rankIndex: number,
    moves: Move[],
  ) => {
    const directions = DIRECTION_VECTORS.knight

    for (const dir of directions) {
      const newFileIndex = fileIndex + dir[0]
      const newRankIndex = rankIndex + dir[1]
      const newSquare = indicesToSquare(newFileIndex, newRankIndex)

      // Skip if new square is off the board
      if (!newSquare) continue

      // Check if the square is empty or has an enemy piece
      const pieceAtSquare = getPieceAtSquare(newSquare)

      if (!pieceAtSquare) {
        // Empty square - add normal move
        moves.push({
          piece,
          from: piece.square,
          to: newSquare,
          type: 'normal',
          notation: generateMoveNotation(
            {
              piece,
              from: piece.square,
              to: newSquare,
              type: 'normal',
            } as Move,
            pieces,
          ),
        })
      } else if (pieceAtSquare.color !== piece.color) {
        // Enemy piece - add capture
        moves.push({
          piece,
          from: piece.square,
          to: newSquare,
          type: 'capture',
          capturedPiece: pieceAtSquare,
          notation: generateMoveNotation(
            {
              piece,
              from: piece.square,
              to: newSquare,
              type: 'capture',
              capturedPiece: pieceAtSquare,
            } as Move,
            pieces,
          ),
        })
      }
      // Skip if friendly piece (no valid move)
    }
  }

  // Generate king moves
  const generateKingMoves = (piece: Piece, fileIndex: number, rankIndex: number, moves: Move[]) => {
    const directions = DIRECTION_VECTORS.king

    for (const dir of directions) {
      const newFileIndex = fileIndex + dir[0]
      const newRankIndex = rankIndex + dir[1]
      const newSquare = indicesToSquare(newFileIndex, newRankIndex)

      // Skip if new square is off the board
      if (!newSquare) continue

      // Check if the square is empty or has an enemy piece
      const pieceAtSquare = getPieceAtSquare(newSquare)

      if (!pieceAtSquare) {
        // Empty square - add normal move
        moves.push({
          piece,
          from: piece.square,
          to: newSquare,
          type: 'normal',
          notation: generateMoveNotation(
            {
              piece,
              from: piece.square,
              to: newSquare,
              type: 'normal',
            } as Move,
            pieces,
          ),
        })
      } else if (pieceAtSquare.color !== piece.color) {
        // Enemy piece - add capture
        moves.push({
          piece,
          from: piece.square,
          to: newSquare,
          type: 'capture',
          capturedPiece: pieceAtSquare,
          notation: generateMoveNotation(
            {
              piece,
              from: piece.square,
              to: newSquare,
              type: 'capture',
              capturedPiece: pieceAtSquare,
            } as Move,
            pieces,
          ),
        })
      }
      // Skip if friendly piece (no valid move)
    }

    // TODO: Castling will be implemented in Feature 8 (Advanced Chess Rules)
  }

  // Get all legal moves for a specific color
  const getLegalMovesForColor = (color: PieceColor): Move[] => {
    const colorPieces = pieces.filter((p) => p.color === color)
    let allMoves: Move[] = []

    for (const piece of colorPieces) {
      const pieceMoves = generateMovesForPiece(piece)
      allMoves = [...allMoves, ...pieceMoves]
    }

    return allMoves
  }

  // Check if a move is valid
  const isValidMove = (from: Square, to: Square, color: PieceColor): boolean => {
    const piece = getPieceAtSquare(from)
    if (!piece || piece.color !== color) return false

    const moves = generateMovesForPiece(piece)
    return moves.some((move) => move.to === to)
  }

  // Find a specific move
  const findMove = (from: Square, to: Square): Move | undefined => {
    const piece = getPieceAtSquare(from)
    if (!piece) return undefined

    const moves = generateMovesForPiece(piece)
    return moves.find((move) => move.to === to)
  }

  // Validate if a king is in check
  const isKingInCheck = (color: PieceColor): boolean => {
    // Find the king
    const king = getKing(color)
    if (!king) return false

    // Get all opponent pieces
    const opponentColor = color === 'white' ? 'black' : 'white'
    const opponentPieces = pieces.filter((p) => p.color === opponentColor)

    // Check if any opponent piece can capture the king
    for (const piece of opponentPieces) {
      const moves = generateMovesForPiece(piece)
      if (moves.some((move) => move.to === king.square && move.type === 'capture')) {
        return true
      }
    }

    return false
  }

  // Check if a move would result in the player's king being in check
  const wouldResultInCheck = (from: Square, to: Square, color: PieceColor): boolean => {
    // Make a deep copy of the pieces array to simulate the move
    const simulatedPieces = JSON.parse(JSON.stringify(pieces))

    // Find the pieces in the simulated array
    const pieceIndex = simulatedPieces.findIndex((p: Piece) => p.square === from)
    if (pieceIndex === -1) return false

    const capturedIndex = simulatedPieces.findIndex((p: Piece) => p.square === to)

    // Remove the captured piece if there is one
    if (capturedIndex !== -1) {
      simulatedPieces.splice(capturedIndex, 1)
    }

    // Move the piece
    simulatedPieces[pieceIndex].square = to

    // Create a temporary rules instance with the simulated pieces
    const tempRules = useChessRules(simulatedPieces)

    // Check if the king is in check after the move
    return tempRules.isKingInCheck(color)
  }

  return {
    getPieceAtSquare,
    isSquareEmpty,
    hasEnemyPiece,
    generateMovesForPiece,
    getLegalMovesForColor,
    isValidMove,
    findMove,
    getKing,
    isKingInCheck,
    wouldResultInCheck,
  }
}
