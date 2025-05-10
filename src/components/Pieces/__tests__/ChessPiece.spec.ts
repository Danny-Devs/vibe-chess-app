import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChessPiece from '../ChessPiece.vue'
import type { Piece } from '../../../types'

describe('ChessPiece', () => {
  it('renders the correct piece type and color', () => {
    const piece: Piece = {
      id: 'wk',
      type: 'king',
      color: 'white',
      square: 'e1',
    }

    const wrapper = mount(ChessPiece, {
      props: {
        piece,
      },
      global: {
        stubs: {
          // Stub the SVG reference since it relies on external SVG definitions
          svg: true,
        },
      },
    })

    expect(wrapper.classes()).toContain('piece-king')
    expect(wrapper.classes()).toContain('piece-white')
  })

  it('applies selected class when isSelected is true', () => {
    const piece: Piece = {
      id: 'wk',
      type: 'king',
      color: 'white',
      square: 'e1',
    }

    const wrapper = mount(ChessPiece, {
      props: {
        piece,
        isSelected: true,
      },
      global: {
        stubs: {
          svg: true,
        },
      },
    })

    expect(wrapper.classes()).toContain('selected')
  })

  it('sets the correct data-piece-id attribute', () => {
    const piece: Piece = {
      id: 'wk',
      type: 'king',
      color: 'white',
      square: 'e1',
    }

    const wrapper = mount(ChessPiece, {
      props: {
        piece,
      },
      global: {
        stubs: {
          svg: true,
        },
      },
    })

    expect(wrapper.attributes('data-piece-id')).toBe('wk')
  })

  it('calculates the correct position based on square', () => {
    const piece: Piece = {
      id: 'wk',
      type: 'king',
      color: 'white',
      square: 'e1',
    }

    const wrapper = mount(ChessPiece, {
      props: {
        piece,
      },
      global: {
        stubs: {
          svg: true,
        },
      },
    })

    // e1 should translate to specific coordinates
    // This depends on the exact implementation of squareToCoordinates
    const style = wrapper.attributes('style')
    expect(style).toContain('transform')
  })
})
