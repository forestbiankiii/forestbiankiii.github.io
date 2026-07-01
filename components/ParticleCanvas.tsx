"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import {
  BASE_ALPHA,
  BASE_RADIUS,
  createParticleGrid,
  getParticleInteraction,
  isParticleSettled,
  MOUSE_RADIUS,
  PARTICLE_ANIMATION,
  settleParticleIfClose,
  type Particle,
  type ParticleInteraction,
  type PointerPosition,
} from "./particlePhysics";
import { useWindowPointer } from "./useWindowPointer";

interface ParticleCanvasProps {
  rgb: string;
  mouseRef?: MutableRefObject<PointerPosition>;
  className?: string;
}

export default function ParticleCanvas({
  rgb,
  mouseRef,
  className = "absolute inset-0 w-full h-full pointer-events-none",
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const localPointer = useWindowPointer({
    enabled: !mouseRef,
  });

  useEffect(() => {
    const canvasNode = canvasRef.current;
    if (!canvasNode) return;
    const canvasElement: HTMLCanvasElement = canvasNode;

    const canvasContext = canvasElement.getContext("2d");
    if (!canvasContext) return;
    const context: CanvasRenderingContext2D = canvasContext;

    const pointerRef = mouseRef ?? localPointer.pointerRef;
    const interactiveParticles: Particle[] = [];
    const backgroundParticles: Particle[] = [];
    const interaction: ParticleInteraction = {
      dx: 0,
      dy: 0,
      distanceSquared: 0,
      inRange: false,
    };
    const solidColor = `rgb(${rgb})`;
    let resizeFrame = 0;
    let lastAnimationTime = 0;

    function rebuildParticleGrid() {
      const particles = createParticleGrid(
        canvasElement.width,
        canvasElement.height,
      );
      particlesRef.current = particles;
    }

    function resize() {
      if (
        particlesRef.current.length > 0 &&
        canvasElement.width === window.innerWidth &&
        canvasElement.height === window.innerHeight
      ) {
        return;
      }

      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;
      rebuildParticleGrid();
    }

    function scheduleResize() {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    }

    function springForce(displacement: number) {
      const sign = displacement > 0 ? 1 : -1;
      const absoluteDisplacement = Math.abs(displacement);
      return (
        sign *
        (1 -
          Math.pow(
            1 -
              Math.min(
                absoluteDisplacement / MOUSE_RADIUS,
                1,
              ),
            3,
          )) *
        PARTICLE_ANIMATION.springStrength
      );
    }

    function updateParticle(
      particle: Particle,
      inRange: boolean,
      dx: number,
      dy: number,
      distanceSquared: number,
    ) {
      let proximity = 0;

      if (inRange) {
        const distance = Math.sqrt(distanceSquared);
        proximity = Math.pow(
          1 - distance / MOUSE_RADIUS,
          2,
        );
        particle.flickerPhase +=
          PARTICLE_ANIMATION.flickerSpeed *
          particle.flickerFreq;
        const flickerWave =
          (Math.sin(particle.flickerPhase) + 1) / 2;
        particle.renderAlpha =
          BASE_ALPHA +
          (1 - BASE_ALPHA) * flickerWave * proximity;

        if (distance > 0) {
          const force =
            Math.sqrt(proximity) *
            PARTICLE_ANIMATION.pushForce;
          particle.vx -= (dx / distance) * force;
          particle.vy -= (dy / distance) * force;
        }
      } else {
        particle.renderAlpha = BASE_ALPHA;
      }

      const targetRadius =
        BASE_RADIUS +
        proximity * PARTICLE_ANIMATION.radiusBoost;
      particle.currentRadius +=
        (targetRadius - particle.currentRadius) *
        PARTICLE_ANIMATION.radiusEase;
      particle.vx += springForce(
        particle.originX - particle.x,
      );
      particle.vy += springForce(
        particle.originY - particle.y,
      );

      const speed = Math.sqrt(
        particle.vx * particle.vx +
          particle.vy * particle.vy,
      );
      const friction =
        PARTICLE_ANIMATION.frictionBase -
        Math.min(
          speed * PARTICLE_ANIMATION.frictionSpeedScale,
          PARTICLE_ANIMATION.frictionSpeedLimit,
        );
      particle.vx *= friction;
      particle.vy *= friction;
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (!inRange) {
        settleParticleIfClose(particle);
      }
    }

    function drawBackgroundParticles() {
      if (backgroundParticles.length === 0) return;

      context.globalAlpha = BASE_ALPHA;
      context.beginPath();
      for (const particle of backgroundParticles) {
        context.moveTo(
          particle.x + particle.currentRadius,
          particle.y,
        );
        context.arc(
          particle.x,
          particle.y,
          particle.currentRadius,
          0,
          Math.PI * 2,
        );
      }
      context.fill();
    }

    function drawInteractiveParticles() {
      for (const particle of interactiveParticles) {
        context.globalAlpha = particle.renderAlpha;
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          particle.currentRadius,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    }

    function animate(frameTime: number) {
      animationRef.current =
        requestAnimationFrame(animate);

      if (
        lastAnimationTime > 0 &&
        frameTime - lastAnimationTime <
          PARTICLE_ANIMATION.frameIntervalMs
      ) {
        return;
      }

      lastAnimationTime = frameTime;
      context.clearRect(
        0,
        0,
        canvasElement.width,
        canvasElement.height,
      );

      const mouse = pointerRef.current;
      interactiveParticles.length = 0;
      backgroundParticles.length = 0;

      for (const particle of particlesRef.current) {
        getParticleInteraction(particle, mouse, interaction);
        const { dx, dy, distanceSquared, inRange } =
          interaction;

        if (inRange || !isParticleSettled(particle)) {
          updateParticle(
            particle,
            inRange,
            dx,
            dy,
            distanceSquared,
          );
        }

        if (inRange) {
          interactiveParticles.push(particle);
        } else {
          backgroundParticles.push(particle);
        }
      }

      context.fillStyle = solidColor;
      drawBackgroundParticles();
      drawInteractiveParticles();
      context.globalAlpha = 1;
    }

    resize();
    window.addEventListener("resize", scheduleResize);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", scheduleResize);
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(animationRef.current);
    };
  }, [rgb, mouseRef, localPointer.pointerRef]);

  return <canvas ref={canvasRef} className={className} />;
}
