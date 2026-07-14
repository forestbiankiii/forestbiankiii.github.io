export const LANYARD_RETRACTION_TARGET = 11;

const SPRING_STIFFNESS = 72;
const SPRING_DAMPING = 10;
const MAX_FRAME_STEP = 1 / 30;

export type LanyardRetractionState = {
  offset: number;
  velocity: number;
  elapsed: number;
};

export function createLanyardRetractionState(): LanyardRetractionState {
  return { offset: 0, velocity: 0, elapsed: 0 };
}

export function stepLanyardRetraction(
  state: LanyardRetractionState,
  delta: number,
): LanyardRetractionState {
  const dt = Math.min(Math.max(delta, 0), MAX_FRAME_STEP);
  const acceleration =
    SPRING_STIFFNESS * (LANYARD_RETRACTION_TARGET - state.offset) -
    SPRING_DAMPING * state.velocity;
  const velocity = state.velocity + acceleration * dt;

  return {
    offset: state.offset + velocity * dt,
    velocity,
    elapsed: state.elapsed + dt,
  };
}

export function getLanyardRetractionKick(cardX: number) {
  const direction = cardX <= 0 ? 1 : -1;

  return {
    impulse: {
      x: direction * 4.2,
      y: 2.6,
      z: direction * 0.45,
    },
    torque: {
      x: direction * 0.35,
      y: direction * 0.5,
      z: direction * -2.1,
    },
  };
}

export function isLanyardRetractionComplete(
  state: LanyardRetractionState,
  cardY: number,
) {
  return (state.elapsed >= 0.75 && cardY >= 6.5) || state.elapsed >= 1.8;
}
