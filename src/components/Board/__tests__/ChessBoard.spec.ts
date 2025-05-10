import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChessBoard from '../ChessBoard.vue'
import { ChessSquare } from '../../Square'

describe('ChessBoard', () => {
  it('renders the board with 64 squares', () => {
    const wrapper = mount(ChessBoard)
    const squares = wrapper.findAllComponents(ChessSquare)
    expect(squares.length).toBe(64)
  })

  it('alternates square colors correctly', () => {
    const wrapper = mount(ChessBoard)
    const squares = wrapper.findAllComponents(ChessSquare)

    // Check a few key squares for correct coloring
    // a1 should be light (odd sum of indices)
    expect(squares[56].props('color')).toBe('light')

    // a8 should be dark (even sum of indices)
    expect(squares[0].props('color')).toBe('dark')
  })

  it('shows coordinates when showCoordinates prop is true', () => {
    const wrapper = mount(ChessBoard, {
      props: {
        showCoordinates: true,
      },
    })

    const squares = wrapper.findAllComponents(ChessSquare)
    expect(squares[0].props('showCoordinates')).toBe(true)
  })

  it('hides coordinates when showCoordinates prop is false', () => {
    const wrapper = mount(ChessBoard, {
      props: {
        showCoordinates: false,
      },
    })

    const squares = wrapper.findAllComponents(ChessSquare)
    expect(squares[0].props('showCoordinates')).toBe(false)
  })
})
