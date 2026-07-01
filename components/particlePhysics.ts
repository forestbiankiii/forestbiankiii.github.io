export const BASE_RADIUS = 2.5;
export const MOUSE_RADIUS = 200;
export const PARTICLE_SPACING = 36;
export const PARTICLE_ROW_HEIGHT =
  PARTICLE_SPACING * (Math.sqrt(3) / 2);
export const BASE_ALPHA = 0.35;
export const PARTICLE_ANIMATION = {
  frameIntervalMs: 1000 / 50,
  pushForce: 0.12,
  flickerSpeed: 0.018,
  radiusBoost: 2.5,
  radiusEase: 0.08,
  springStrength: 0.08,
  frictionBase: 0.88,
  frictionSpeedScale: 0.002,
  frictionSpeedLimit: 0.05,
} as const;

export interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  flickerPhase: number;
  flickerFreq: number;
  currentRadius: number;
  renderAlpha: number;
}

export interface PointerPosition {
  x: number;
  y: number;
}

export interface ParticleInteraction {
  dx: number;
  dy: number;
  distanceSquared: number;
  inRange: boolean;
}

export function createParticleGrid(
  width: number,
  height: number,
  random = Math.random,
) {
  const particles: Particle[] = [];
  const columns =
    Math.ceil(width / PARTICLE_SPACING) + 1;
  const rows =
    Math.ceil(height / PARTICLE_ROW_HEIGHT) + 1;
  const totalWidth =
    (columns - 1) * PARTICLE_SPACING;
  const totalHeight =
    (rows - 1) * PARTICLE_ROW_HEIGHT;
  const offsetX = (width - totalWidth) / 2;
  const offsetY = (height - totalHeight) / 2;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const xOffset =
        row % 2 === 1 ? PARTICLE_SPACING / 2 : 0;
      const x =
        offsetX + column * PARTICLE_SPACING + xOffset;
      const y = offsetY + row * PARTICLE_ROW_HEIGHT;

      particles.push({
        originX: x,
        originY: y,
        x,
        y,
        vx: 0,
        vy: 0,
        flickerPhase: random() * Math.PI * 2,
        flickerFreq: 0.5 + random(),
        currentRadius: BASE_RADIUS,
        renderAlpha: BASE_ALPHA,
      });
    }
  }

  return particles;
}

export function getParticleInteraction(
  particle: Particle,
  pointer: PointerPosition,
  result: ParticleInteraction,
) {
  const dx = pointer.x - particle.x;
  const dy = pointer.y - particle.y;
  const distanceSquared = dx * dx + dy * dy;

  result.dx = dx;
  result.dy = dy;
  result.distanceSquared = distanceSquared;
  result.inRange =
    distanceSquared < MOUSE_RADIUS * MOUSE_RADIUS;

  return result;
}

export function isParticleSettled(particle: Particle) {
  return (
    particle.x === particle.originX &&
    particle.y === particle.originY &&
    particle.vx === 0 &&
    particle.vy === 0 &&
    particle.currentRadius === BASE_RADIUS
  );
}

export function settleParticleIfClose(particle: Particle) {
  const shouldSettle =
    Math.abs(particle.x - particle.originX) < 0.01 &&
    Math.abs(particle.y - particle.originY) < 0.01 &&
    Math.abs(particle.vx) < 0.001 &&
    Math.abs(particle.vy) < 0.001 &&
    Math.abs(particle.currentRadius - BASE_RADIUS) < 0.001;

  if (!shouldSettle) return false;

  particle.x = particle.originX;
  particle.y = particle.originY;
  particle.vx = 0;
  particle.vy = 0;
  particle.currentRadius = BASE_RADIUS;
  return true;
}
