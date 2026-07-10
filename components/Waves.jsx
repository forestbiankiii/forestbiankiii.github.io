import { useEffect, useRef } from "react";

import "./Waves.css";

class Grad {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot2(x, y) {
    return this.x * x + this.y * y;
  }
}

class Noise {
  constructor(seed = 0) {
    this.grad3 = [
      new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
      new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
      new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1),
    ];
    this.p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240,
      21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88,
      237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83,
      111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216,
      80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186,
      3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58,
      17, 182, 189, 28,
      42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253,
      19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12,
      191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176,
      115, 121,
      50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    ];
    this.perm = new Array(512);
    this.gradP = new Array(512);
    this.seed(seed);
  }

  seed(seed) {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256) seed |= seed << 8;

    for (let index = 0; index < 256; index += 1) {
      const value = index & 1
        ? this.p[index] ^ (seed & 255)
        : this.p[index] ^ ((seed >> 8) & 255);
      this.perm[index] = this.perm[index + 256] = value;
      this.gradP[index] = this.gradP[index + 256] = this.grad3[value % 12];
    }
  }

  fade(value) {
    return value * value * value * (value * (value * 6 - 15) + 10);
  }

  lerp(start, end, amount) {
    return (1 - amount) * start + amount * end;
  }

  perlin2(x, y) {
    let xIndex = Math.floor(x);
    let yIndex = Math.floor(y);
    x -= xIndex;
    y -= yIndex;
    xIndex &= 255;
    yIndex &= 255;

    const n00 = this.gradP[xIndex + this.perm[yIndex]].dot2(x, y);
    const n01 = this.gradP[xIndex + this.perm[yIndex + 1]].dot2(x, y - 1);
    const n10 = this.gradP[xIndex + 1 + this.perm[yIndex]].dot2(x - 1, y);
    const n11 = this.gradP[xIndex + 1 + this.perm[yIndex + 1]].dot2(x - 1, y - 1);
    const amount = this.fade(x);

    return this.lerp(
      this.lerp(n00, n10, amount),
      this.lerp(n01, n11, amount),
      this.fade(y),
    );
  }
}

const Waves = ({
  lineColor = "black",
  backgroundColor = "transparent",
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  lineWidth = 1,
  style = {},
  className = "",
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const boundingRef = useRef({ width: 0, height: 0, left: 0, top: 0 });
  const noiseRef = useRef(new Noise(Math.random()));
  const linesRef = useRef([]);
  const mouseRef = useRef({
    x: -10,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    vs: 0,
    a: 0,
    set: false,
  });
  const configRef = useRef({
    lineColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    friction,
    tension,
    maxCursorMove,
    lineWidth,
    xGap,
    yGap,
  });

  useEffect(() => {
    configRef.current = {
      lineColor,
      waveSpeedX,
      waveSpeedY,
      waveAmpX,
      waveAmpY,
      friction,
      tension,
      maxCursorMove,
      lineWidth,
      xGap,
      yGap,
    };
  }, [
    lineColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    friction,
    tension,
    maxCursorMove,
    lineWidth,
    xGap,
    yGap,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !container || !context) return;

    let frameId = 0;

    function setSize() {
      boundingRef.current = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(boundingRef.current.width * pixelRatio);
      canvas.height = Math.round(boundingRef.current.height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function setLines() {
      const { width, height } = boundingRef.current;
      const { xGap: horizontalGap, yGap: verticalGap } = configRef.current;
      const totalLines = Math.ceil((width + 200) / horizontalGap);
      const totalPoints = Math.ceil((height + 30) / verticalGap);
      const xStart = (width - horizontalGap * totalLines) / 2;
      const yStart = (height - verticalGap * totalPoints) / 2;

      linesRef.current = Array.from({ length: totalLines + 1 }, (_, lineIndex) =>
        Array.from({ length: totalPoints + 1 }, (_, pointIndex) => ({
          x: xStart + horizontalGap * lineIndex,
          y: yStart + verticalGap * pointIndex,
          wave: { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        })),
      );
    }

    function movePoints(time) {
      const mouse = mouseRef.current;
      const noise = noiseRef.current;
      const {
        waveSpeedX: speedX,
        waveSpeedY: speedY,
        waveAmpX: amplitudeX,
        waveAmpY: amplitudeY,
        friction: damping,
        tension: spring,
        maxCursorMove: cursorLimit,
      } = configRef.current;

      linesRef.current.forEach((points) => {
        points.forEach((point) => {
          const move = noise.perlin2(
            (point.x + time * speedX) * 0.002,
            (point.y + time * speedY) * 0.0015,
          ) * 12;
          point.wave.x = Math.cos(move) * amplitudeX;
          point.wave.y = Math.sin(move) * amplitudeY;

          const dx = point.x - mouse.sx;
          const dy = point.y - mouse.sy;
          const distance = Math.hypot(dx, dy);
          const radius = Math.max(175, mouse.vs);
          if (distance < radius) {
            const strength = 1 - distance / radius;
            const force = Math.cos(distance * 0.001) * strength;
            point.cursor.vx += Math.cos(mouse.a) * force * radius * mouse.vs * 0.00065;
            point.cursor.vy += Math.sin(mouse.a) * force * radius * mouse.vs * 0.00065;
          }

          point.cursor.vx += -point.cursor.x * spring;
          point.cursor.vy += -point.cursor.y * spring;
          point.cursor.vx *= damping;
          point.cursor.vy *= damping;
          point.cursor.x = Math.min(cursorLimit, Math.max(-cursorLimit, point.cursor.x + point.cursor.vx * 2));
          point.cursor.y = Math.min(cursorLimit, Math.max(-cursorLimit, point.cursor.y + point.cursor.vy * 2));
        });
      });
    }

    function moved(point, includeCursor = true) {
      return {
        x: Math.round((point.x + point.wave.x + (includeCursor ? point.cursor.x : 0)) * 10) / 10,
        y: Math.round((point.y + point.wave.y + (includeCursor ? point.cursor.y : 0)) * 10) / 10,
      };
    }

    function drawLines() {
      const { width, height } = boundingRef.current;
      context.clearRect(0, 0, width, height);
      context.beginPath();
      context.strokeStyle = configRef.current.lineColor;
      context.lineWidth = configRef.current.lineWidth;
      context.lineCap = "round";
      context.lineJoin = "round";

      linesRef.current.forEach((points) => {
        const lastIndex = points.length - 1;
        const movedPoints = points.map((point, index) =>
          moved(point, index > 0 && index < lastIndex),
        );
        context.moveTo(movedPoints[0].x, movedPoints[0].y);

        for (let index = 1; index < lastIndex; index += 1) {
          const point = movedPoints[index];
          const nextPoint = movedPoints[index + 1];
          const endPoint = index === lastIndex - 1
            ? nextPoint
            : {
                x: (point.x + nextPoint.x) / 2,
                y: (point.y + nextPoint.y) / 2,
              };
          context.quadraticCurveTo(point.x, point.y, endPoint.x, endPoint.y);
        }
      });

      context.stroke();
    }

    function updateMouse(clientX, clientY) {
      const mouse = mouseRef.current;
      const bounds = boundingRef.current;
      mouse.x = clientX - bounds.left;
      mouse.y = clientY - bounds.top;

      if (!mouse.set) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
        mouse.lx = mouse.x;
        mouse.ly = mouse.y;
        mouse.set = true;
      }
    }

    function tick(time) {
      const mouse = mouseRef.current;
      mouse.sx += (mouse.x - mouse.sx) * 0.1;
      mouse.sy += (mouse.y - mouse.sy) * 0.1;
      const dx = mouse.x - mouse.lx;
      const dy = mouse.y - mouse.ly;
      const distance = Math.hypot(dx, dy);
      mouse.vs += (distance - mouse.vs) * 0.1;
      mouse.vs = Math.min(100, mouse.vs);
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy, dx);

      movePoints(time);
      drawLines();
      frameId = requestAnimationFrame(tick);
    }

    function handleResize() {
      setSize();
      setLines();
    }

    function handleMouseMove(event) {
      updateMouse(event.clientX, event.clientY);
    }

    function handleTouchMove(event) {
      const touch = event.touches[0];
      if (touch) updateMouse(touch.clientX, touch.clientY);
    }

    handleResize();
    frameId = requestAnimationFrame(tick);
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`waves ${className}`}
      style={{ backgroundColor, ...style }}
    >
      <canvas ref={canvasRef} className="waves-canvas" />
    </div>
  );
};

export default Waves;
