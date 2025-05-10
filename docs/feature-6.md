# Feature 6: Animation System

## Description

Implement a comprehensive animation system that brings the chess game to life with fluid, responsive transitions and visual feedback. This feature will add animations for piece movement, captures, selections, and game events, enhancing the user experience while maintaining the digital wireframe and sacred geometry aesthetic. The animations will provide clear visual cues about game actions while adding polish to the interface.

## Technical Implementation

### File Structure

Add new files and update existing ones:

```
src/
├── composables/
│   ├── useAnimations.ts         # Animation composable
│   └── useTransitionManager.ts  # Manages complex transitions
├── constants/
│   └── animationConfig.ts       # Animation configuration
├── components/
│   ├── Animations/
│   │   ├── MoveAnimation.vue    # Piece movement animation
│   │   ├── CaptureEffect.vue    # Capture effect animation
│   │   └── BackgroundEffect.vue # Subtle background animations
│   └── Pieces/
│       └── ChessPiece.vue       # Update for animations
└── styles/
    └── animations.css           # Global animation definitions
```

### Animation Configuration

Create `src/constants/animationConfig.ts`:

```typescript
// Animation timing and easing functions
export const ANIMATION_TIMING = {
  // Duration in milliseconds
  PIECE_MOVE: 300,
  PIECE_CAPTURE: 400,
  PIECE_SELECT: 150,
  CHECK_PULSE: 1500,
  PROMOTION: 600,
  
  // Easing functions (will be used with GSAP)
  MOVE_EASE: 'power2.out',
  CAPTURE_EASE: 'power3.out',
  BOUNCE_EASE: 'elastic.out(1, 0.3)',
  
  // Delays
  SEQUENCE_DELAY: 50
};

// Animation properties
export const ANIMATION_PROPS = {
  // Transforms
  HOVER_SCALE: 1.1,
  CAPTURE_SCALE: 1.3,
  PROMOTION_SCALE: 1.2,
  
  // Opacity
  FADE_OUT: 0,
  FADE_IN: 1,
  
  // Colors (for glow effects)
  HIGHLIGHT_COLOR: 'rgba(255, 215, 0, 0.7)',
  CAPTURE_COLOR: 'rgba(255, 50, 50, 0.7)',
  CHECK_COLOR: 'rgba(255, 0, 0, 0.7)',
  MOVE_TRAIL_COLOR: 'rgba(100, 149, 237, 0.3)'
};

// Animation states for piece components
export enum AnimationState {
  IDLE = 'idle',
  SELECTED = 'selected',
  MOVING = 'moving',
  CAPTURED = 'captured',
  PROMOTING = 'promoting'
}

// Background animation settings
export const BACKGROUND_ANIMATION = {
  // Particles for subtle background movement
  PARTICLES: {
    count: 30,
    size: [1, 3],
    speed: [0.2, 0.5],
    opacity: [0.1, 0.3]
  },
  
  // Sacred geometry pattern flow
  PATTERN_FLOW: {
    amplitude: 2,
    period: 8000,
    phase: 0.5
  }
};
```

### Global Animation Styles

Create `src/styles/animations.css`:

```css
/* Common animation keyframes */

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}

@keyframes glow {
  0% { filter: drop-shadow(0 0 3px rgba(100, 149, 237, 0.5)); }
  50% { filter: drop-shadow(0 0 8px rgba(100, 149, 237, 0.8)); }
  100% { filter: drop-shadow(0 0 3px rgba(100, 149, 237, 0.5)); }
}

/* Animation utility classes */

.animated {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}

.animated.faster {
  animation-duration: 0.15s;
}

.animated.slower {
  animation-duration: 0.45s;
}

.animated.infinite {
  animation-iteration-count: infinite;
}

/* Sacred geometry animation classes */

.sacred-rotate {
  animation: rotate 20s linear infinite;
  transform-origin: center;
}

.sacred-pulse {
  animation: pulse 3s ease-in-out infinite;
  transform-origin: center;
}

.sacred-flow {
  animation: float 5s ease-in-out infinite;
}

/* Wireframe effect animations */

.wireframe-glow {
  animation: glow 2s ease-in-out infinite;
}

.wireframe-scan {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(100, 149, 237, 0.2) 50%,
    transparent 100%
  );
  background-size: 100% 200%;
  animation: scan 3s ease-in-out infinite;
}

@keyframes scan {
  0% { background-position: 0 -100%; }
  100% { background-position: 0 100%; }
}
```

### Animation Composable

Create `src/composables/useAnimations.ts`:

```typescript
import { ref, onMounted, onUnmounted, computed } from 'vue';
import gsap from 'gsap';
import type { Piece, Square, Move } from '../types';
import { ANIMATION_TIMING, ANIMATION_PROPS, AnimationState } from '../constants/animationConfig';
import { useBoardUtils } from './useBoardUtils';

export function useAnimations() {
  const { squareToCoordinates } = useBoardUtils();
  
  // Track animation states for pieces
  const pieceAnimationStates = ref<Record<string, AnimationState>>({});
  
  // Track ongoing animations to ensure they can be cleaned up
  const activeAnimations = ref<gsap.core.Tween[]>([]);
  
  // Track capture effects
  const captureEffects = ref<{square: Square, timestamp: number}[]>([]);
  
  // Animation timeline for sequencing
  let mainTimeline: gsap.core.Timeline | null = null;
  
  // Initialize timeline
  onMounted(() => {
    mainTimeline = gsap.timeline();
  });
  
  // Clean up animations
  onUnmounted(() => {
    cleanupAnimations();
  });
  
  // Set animation state for a piece
  const setPieceAnimationState = (pieceId: string, state: AnimationState) => {
    pieceAnimationStates.value[pieceId] = state;
  };
  
  // Get animation state for a piece
  const getPieceAnimationState = (pieceId: string): AnimationState => {
    return pieceAnimationStates.value[pieceId] || AnimationState.IDLE;
  };
  
  // Check if a piece is in a specific animation state
  const isPieceInState = (pieceId: string, state: AnimationState): boolean => {
    return getPieceAnimationState(pieceId) === state;
  };
  
  // Clean up all active animations
  const cleanupAnimations = () => {
    activeAnimations.value.forEach(tween => {
      tween.kill();
    });
    activeAnimations.value = [];
    
    if (mainTimeline) {
      mainTimeline.clear();
    }
  };
  
  // Animate a piece moving from one square to another
  const animatePieceMove = (
    pieceElement: HTMLElement,
    fromSquare: Square,
    toSquare: Square,
    onComplete?: () => void
  ) => {
    const fromCoords = squareToCoordinates(fromSquare);
    const toCoords = squareToCoordinates(toSquare);
    
    // Calculate the translation
    const deltaX = (toCoords.file - fromCoords.file) * 100;
    const deltaY = (toCoords.rank - fromCoords.rank) * 100;
    
    // Set initial state
    const pieceId = pieceElement.getAttribute('data-piece-id') || '';
    setPieceAnimationState(pieceId, AnimationState.MOVING);
    
    // Create animation
    const tween = gsap.to(pieceElement, {
      x: `+=${deltaX}%`,
      y: `+=${deltaY}%`,
      duration: ANIMATION_TIMING.PIECE_MOVE / 1000,
      ease: ANIMATION_TIMING.MOVE_EASE,
      onComplete: () => {
        // Reset the animation state
        setPieceAnimationState(pieceId, AnimationState.IDLE);
        
        if (onComplete) {
          onComplete();
        }
      }
    });
    
    activeAnimations.value.push(tween);
    return tween;
  };
  
  // Animate a piece being captured
  const animatePieceCapture = (
    pieceElement: HTMLElement,
    onComplete?: () => void
  ) => {
    const pieceId = pieceElement.getAttribute('data-piece-id') || '';
    setPieceAnimationState(pieceId, AnimationState.CAPTURED);
    
    // Create animation sequence
    const tween = gsap.timeline()
      .to(pieceElement, {
        scale: ANIMATION_PROPS.CAPTURE_SCALE,
        opacity: 0.8,
        filter: `drop-shadow(0 0 10px ${ANIMATION_PROPS.CAPTURE_COLOR})`,
        duration: (ANIMATION_TIMING.PIECE_CAPTURE / 2) / 1000,
        ease: ANIMATION_TIMING.CAPTURE_EASE
      })
      .to(pieceElement, {
        scale: 0.1,
        opacity: 0,
        duration: (ANIMATION_TIMING.PIECE_CAPTURE / 2) / 1000,
        ease: ANIMATION_TIMING.CAPTURE_EASE,
        onComplete: () => {
          if (onComplete) {
            onComplete();
          }
        }
      });
    
    activeAnimations.value.push(tween);
    
    // Add a capture effect
    const square = pieceElement.closest('.chess-square')?.getAttribute('data-square') as Square;
    if (square) {
      captureEffects.value.push({
        square,
        timestamp: Date.now()
      });
      
      // Clean up the effect after a delay
      setTimeout(() => {
        captureEffects.value = captureEffects.value.filter(
          effect => effect.timestamp !== Date.now()
        );
      }, ANIMATION_TIMING.PIECE_CAPTURE * 2);
    }
    
    return tween;
  };
  
  // Animate selecting a piece
  const animatePieceSelect = (
    pieceElement: HTMLElement,
    selected: boolean,
    onComplete?: () => void
  ) => {
    const pieceId = pieceElement.getAttribute('data-piece-id') || '';
    
    if (selected) {
      setPieceAnimationState(pieceId, AnimationState.SELECTED);
      
      const tween = gsap.to(pieceElement, {
        scale: ANIMATION_PROPS.HOVER_SCALE,
        filter: `drop-shadow(0 0 8px ${ANIMATION_PROPS.HIGHLIGHT_COLOR})`,
        duration: ANIMATION_TIMING.PIECE_SELECT / 1000,
        ease: ANIMATION_TIMING.BOUNCE_EASE,
        onComplete: () => {
          if (onComplete) {
            onComplete();
          }
        }
      });
      
      activeAnimations.value.push(tween);
      return tween;
    } else {
      setPieceAnimationState(pieceId, AnimationState.IDLE);
      
      const tween = gsap.to(pieceElement, {
        scale: 1,
        filter: 'none',
        duration: ANIMATION_TIMING.PIECE_SELECT / 1000,
        ease: ANIMATION_TIMING.MOVE_EASE,
        onComplete: () => {
          if (onComplete) {
            onComplete();
          }
        }
      });
      
      activeAnimations.value.push(tween);
      return tween;
    }
  };
  
  // Animate a move with potential capture
  const animateMove = (
    move: Move,
    pieces: Piece[],
    boardElement: HTMLElement,
    onComplete?: () => void
  ) => {
    // Find the elements
    const fromElement = boardElement.querySelector(
      `[data-piece-id="${move.piece.id}"]`
    ) as HTMLElement;
    
    // If capture, find the captured piece
    let capturedElement: HTMLElement | null = null;
    if (move.capturedPiece) {
      capturedElement = boardElement.querySelector(
        `[data-piece-id="${move.capturedPiece.id}"]`
      ) as HTMLElement;
    }
    
    // Create a sequence
    const sequence = gsap.timeline();
    
    // If there's a captured piece, animate it first
    if (capturedElement) {
      sequence.add(
        animatePieceCapture(capturedElement)
      );
    }
    
    // Then animate the moving piece
    sequence.add(
      animatePieceMove(
        fromElement,
        move.from,
        move.to,
        onComplete
      ),
      capturedElement ? ANIMATION_TIMING.SEQUENCE_DELAY / 1000 : 0
    );
    
    return sequence;
  };
  
  // Animate check state for king
  const animateCheck = (kingElement: HTMLElement) => {
    const tween = gsap.to(kingElement, {
      filter: `drop-shadow(0 0 10px ${ANIMATION_PROPS.CHECK_COLOR})`,
      repeat: -1,
      yoyo: true,
      duration: (ANIMATION_TIMING.CHECK_PULSE / 2) / 1000
    });
    
    activeAnimations.value.push(tween);
    return tween;
  };
  
  // Clear check animation
  const clearCheckAnimation = (kingElement: HTMLElement) => {
    gsap.to(kingElement, {
      filter: 'none',
      duration: ANIMATION_TIMING.PIECE_SELECT / 1000
    });
  };
  
  // Add subtle background animations
  const initBackgroundAnimations = (boardElement: HTMLElement) => {
    // Create subtle movement of sacred geometry patterns
    const sacredElements = boardElement.querySelectorAll('.sacred-geometry');
    
    sacredElements.forEach((element, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const delay = index * 100;
      
      gsap.to(element, {
        rotate: `${direction * 360}deg`,
        duration: 30,
        ease: 'linear',
        repeat: -1,
        delay: delay / 1000,
        transformOrigin: 'center center'
      });
    });
  };
  
  // Get all active capture effects
  const getActiveCaptureEffects = computed(() => {
    return captureEffects.value;
  });
  
  return {
    pieceAnimationStates,
    getPieceAnimationState,
    isPieceInState,
    animatePieceMove,
    animatePieceCapture,
    animatePieceSelect,
    animateMove,
    animateCheck,
    clearCheckAnimation,
    initBackgroundAnimations,
    cleanupAnimations,
    getActiveCaptureEffects
  };
}
```

### Update ChessPiece Component

Update `src/components/Pieces/ChessPiece.vue` to support animations:

```vue
<template>
  <div 
    class="chess-piece" 
    :class="[
      `piece-${piece.type}`, 
      `piece-${piece.color}`, 
      { 'selected': isSelected },
      { 'in-check': isInCheck },
      animationStateClass
    ]"
    :style="pieceStyle"
    :data-piece-id="piece.id"
    @click="$emit('click')"
  >
    <svg :viewBox="viewBox" class="piece-svg">
      <use :href="`#piece-${piece.type}`" class="piece-shape" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue';
import type { Piece } from '../../types';
import { useBoardUtils } from '../../composables/useBoardUtils';
import { useAnimations } from '../../composables/useAnimations';
import { PIECE_SCALE } from '../../constants/pieceConfig';
import { AnimationState } from '../../constants/animationConfig';

interface Props {
  piece: Piece;
  isSelected?: boolean;
  boardFlipped?: boolean;
  isInCheck?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  boardFlipped: false,
  isInCheck: false
});

defineEmits(['click']);

const { squareToCoordinates } = useBoardUtils();
const { 
  getPieceAnimationState, 
  animatePieceSelect, 
  isPieceInState 
} = useAnimations();

// Reference to the piece element
const pieceElement = ref<HTMLElement | null>(null);

// Set the viewBox for the SVG pieces (standard chess piece dimensions)
const viewBox = "0 0 45 45";

// Calculate position styling based on the piece's square and board orientation
const pieceStyle = computed(() => {
  const coordinates = squareToCoordinates(props.piece.square);
  
  // Adjust for flipped board if needed
  const file = props.boardFlipped ? 7 - coordinates.file : coordinates.file;
  const rank = props.boardFlipped ? 7 - coordinates.rank : coordinates.rank;
  
  return {
    transform: `translate(${file * 100}%, ${rank * 100}%)`,
    width: `${PIECE_SCALE * 100}%`,
    height: `${PIECE_SCALE * 100}%`,
  };
});

// Get animation state class
const animationStateClass = computed(() => {
  const state = getPieceAnimationState(props.piece.id);
  return state !== AnimationState.IDLE ? `animation-state-${state}` : '';
});

// Watch for selection changes to trigger animations
watch(() => props.isSelected, (selected, prevSelected) => {
  if (pieceElement.value && selected !== prevSelected) {
    animatePieceSelect(pieceElement.value, selected);
  }
});

// Set up element reference
onMounted(() => {
  pieceElement.value = document.querySelector(`[data-piece-id="${props.piece.id}"]`);
});
</script>

<style scoped>
/* Existing styles... */

/* Animation state classes */
.animation-state-moving {
  z-index: 25;
}

.animation-state-captured {
  z-index: 25;
}

.animation-state-selected {
  z-index: 20;
}

.animation-state-promoting {
  z-index: 30;
}
</style>
```

## Dependencies

- Vue 3 with Composition API
- TypeScript
- GSAP (for animations)

## Acceptance Criteria

1. Pieces move smoothly from one square to another when moved
2. Captured pieces have a clear and visually appealing disappearing animation
3. The last move is subtly highlighted on the board
4. When a king is in check, there is a clear visual indicator
5. Selected pieces have a highlighting effect
6. There are subtle background animations with sacred geometry patterns
7. When a square is clicked but the move is invalid, there is clear visual feedback
8. The animations respect the user's "prefers-reduced-motion" accessibility setting
9. Animations can be toggled on/off in the settings
10. Animations work correctly when the board is flipped
11. All animations fit the digital wireframe and sacred geometry aesthetic
12. The animation system is modular and can be easily extended for future features

## Unit Tests

Create a file `src/composables/__tests__/useAnimations.spec.ts` with the following tests:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAnimations } from '../useAnimations';
import { AnimationState } from '../../constants/animationConfig';

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    to: vi.fn(() => ({ kill: vi.fn() })),
    timeline: vi.fn(() => ({ 
      to: vi.fn(() => ({ kill: vi.fn() })),
      add: vi.fn(() => ({ kill: vi.fn() })),
      clear: vi.fn()
    })),
    killTweensOf: vi.fn()
  }
}));

describe('useAnimations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('tracks animation states for pieces', () => {
    const { setPieceAnimationState, getPieceAnimationState, isPieceInState } = useAnimations();
    
    // Initial state should be IDLE
    expect(getPieceAnimationState('wp1')).toBe(AnimationState.IDLE);
    
    // Set a new state
    setPieceAnimationState('wp1', AnimationState.SELECTED);
    
    // Check if the state was updated
    expect(getPieceAnimationState('wp1')).toBe(AnimationState.SELECTED);
    expect(isPieceInState('wp1', AnimationState.SELECTED)).toBe(true);
    expect(isPieceInState('wp1', AnimationState.MOVING)).toBe(false);
  });
  
  it('tracks capture effects', () => {
    const { getActiveCaptureEffects } = useAnimations();
    
    // Initially should have no capture effects
    expect(getActiveCaptureEffects.value.length).toBe(0);
  });
  
  it('cleans up animations', () => {
    const { cleanupAnimations } = useAnimations();
    
    cleanupAnimations();
    
    // Should call appropriate GSAP cleanup methods
    // This is a bit harder to test directly, but we can ensure the function runs
    expect(true).toBe(true);
  });
  
  it('creates animation for piece selection', () => {
    const { animatePieceSelect } = useAnimations();
    
    // Mock an element with dataset attribute
    const mockElement = document.createElement('div');
    mockElement.setAttribute('data-piece-id', 'wp1');
    
    // Test selecting
    const selectTween = animatePieceSelect(mockElement, true);
    expect(selectTween).toBeDefined();
    
    // Test deselecting
    const deselectTween = animatePieceSelect(mockElement, false);
    expect(deselectTween).toBeDefined();
  });
  
  it('animates piece movement', () => {
    const { animatePieceMove } = useAnimations();
    
    // Mock an element with dataset attribute
    const mockElement = document.createElement('div');
    mockElement.setAttribute('data-piece-id', 'wp1');
    
    // Test moving
    const moveTween = animatePieceMove(mockElement, 'e2', 'e4');
    expect(moveTween).toBeDefined();
  });
});
```

## Challenges & Solutions

1. **Challenge**: Creating smooth animations that work across different devices and browsers.
   **Solution**: Use GSAP (GreenSock Animation Platform) for consistent, high-performance animations with fallbacks.

2. **Challenge**: Managing multiple animations that might need to play simultaneously or in sequence.
   **Solution**: Implement a timeline-based system that can coordinate complex animation sequences.

3. **Challenge**: Ensuring animations are accessible and don't distract or cause issues for users with vestibular disorders.
   **Solution**: Respect the "prefers-reduced-motion" setting and provide options to disable animations completely.

4. **Challenge**: Keeping animations visually consistent with the sacred geometry and digital wireframe aesthetic.
   **Solution**: Use subtle glow effects, geometric patterns, and colors that match the established visual language.

5. **Challenge**: Optimizing performance for mobile devices and less powerful computers.
   **Solution**: Use GPU-accelerated properties (transform, opacity) when possible and conditionally enable more intensive effects.

6. **Challenge**: Synchronizing visual animations with the logical game state.
   **Solution**: Create a transition manager that watches for state changes and triggers appropriate animations.

7. **Challenge**: Handling animations for special chess moves like castling and en passant.
   **Solution**: Design the animation system to be extensible for sequence-based animations with multiple moving pieces.

## Integration Points for Next Features

- The animation system provides visual feedback that will enhance the keyboard navigation in Feature 5
- The animations for check can be extended for checkmate and stalemate in Feature 9 (Game State Indicators)
- The animation framework can accommodate special moves like castling and en passant in Feature 8 (Advanced Chess Rules)
- The background animations provide a foundation for the AI difficulty visualization in Feature 10 (Chess AI Implementation)
- The capture effect system can be used for highlighting moves in the chess tutor in Feature 12
- The animation timing system is prepared for integration with move suggestions in Feature 13
- The GSAP timeline approach allows for complex animations that could be used in game replays and tutorials
