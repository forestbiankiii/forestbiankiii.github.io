"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./LiquidEther.css";

export default function LiquidEther({
  mouseForce = 20,
  cursorSize = 100,
  isViscous = false,
  viscous = 30,
  iterationsViscous = 32,
  iterationsPoisson = 32,
  dt = 0.014,
  BFECC = true,
  resolution = 0.5,
  isBounce = false,
  colors = ["#5227FF", "#FF9FFC", "#B497CF"],
  style = {},
  className = "",
  autoDemo = true,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
  takeoverDuration = 0.25,
  autoResumeDelay = 1000,
  autoRampDuration = 0.6,
}) {
  const mountRef = useRef(null);
  const webglRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const rafRef = useRef(null);
  const intersectionObserverRef = useRef(null);
  const isVisibleRef = useRef(true);
  const resizeRafRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return undefined;

    function makePaletteTexture(stops) {
      let palette;
      if (Array.isArray(stops) && stops.length > 0) {
        palette = stops.length === 1 ? [stops[0], stops[0]] : stops;
      } else {
        palette = ["#ffffff", "#ffffff"];
      }

      const width = palette.length;
      const data = new Uint8Array(width * 4);
      for (let index = 0; index < width; index += 1) {
        const color = new THREE.Color(palette[index]);
        data[index * 4] = Math.round(color.r * 255);
        data[index * 4 + 1] = Math.round(color.g * 255);
        data[index * 4 + 2] = Math.round(color.b * 255);
        data[index * 4 + 3] = 255;
      }

      const texture = new THREE.DataTexture(
        data,
        width,
        1,
        THREE.RGBAFormat,
      );
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    }

    const paletteTexture = makePaletteTexture(colors);
    const backgroundColor = new THREE.Vector4(0, 0, 0, 0);

    class CommonClass {
      constructor() {
        this.width = 0;
        this.height = 0;
        this.aspect = 1;
        this.pixelRatio = 1;
        this.container = null;
        this.renderer = null;
        this.lastFrameTime = 0;
        this.time = 0;
        this.delta = 0;
      }

      init(container) {
        this.container = container;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(new THREE.Color(0x000000), 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        this.renderer.domElement.style.display = "block";
        this.lastFrameTime = performance.now();
      }

      resize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.aspect = this.width / this.height;
        if (this.renderer) {
          this.renderer.setSize(this.width, this.height, false);
        }
      }

      update() {
        const now = performance.now();
        this.delta = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        this.time += this.delta;
      }
    }

    const Common = new CommonClass();

    class MouseClass {
      constructor() {
        this.mouseMoved = false;
        this.coords = new THREE.Vector2();
        this.coordsOld = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.timer = null;
        this.container = null;
        this.docTarget = null;
        this.listenerTarget = null;
        this.isHoverInside = false;
        this.hasUserControl = false;
        this.isAutoActive = false;
        this.autoIntensity = 2;
        this.takeoverActive = false;
        this.takeoverStartTime = 0;
        this.takeoverDuration = 0.25;
        this.takeoverFrom = new THREE.Vector2();
        this.takeoverTo = new THREE.Vector2();
        this.onInteract = null;
        this.onMouseMove = this.handleMouseMove.bind(this);
        this.onTouchStart = this.handleTouchStart.bind(this);
        this.onTouchMove = this.handleTouchMove.bind(this);
        this.onTouchEnd = this.handleTouchEnd.bind(this);
        this.onDocumentLeave = this.handleDocumentLeave.bind(this);
      }

      init(container) {
        this.container = container;
        this.docTarget = container.ownerDocument || null;
        const defaultView =
          this.docTarget?.defaultView ||
          (typeof window !== "undefined" ? window : null);
        if (!defaultView) return;

        this.listenerTarget = defaultView;
        this.listenerTarget.addEventListener(
          "mousemove",
          this.onMouseMove,
        );
        this.listenerTarget.addEventListener(
          "touchstart",
          this.onTouchStart,
          { passive: true },
        );
        this.listenerTarget.addEventListener(
          "touchmove",
          this.onTouchMove,
          { passive: true },
        );
        this.listenerTarget.addEventListener(
          "touchend",
          this.onTouchEnd,
        );
        this.docTarget?.addEventListener(
          "mouseleave",
          this.onDocumentLeave,
        );
      }

      dispose() {
        if (this.listenerTarget) {
          this.listenerTarget.removeEventListener(
            "mousemove",
            this.onMouseMove,
          );
          this.listenerTarget.removeEventListener(
            "touchstart",
            this.onTouchStart,
          );
          this.listenerTarget.removeEventListener(
            "touchmove",
            this.onTouchMove,
          );
          this.listenerTarget.removeEventListener(
            "touchend",
            this.onTouchEnd,
          );
        }
        this.docTarget?.removeEventListener(
          "mouseleave",
          this.onDocumentLeave,
        );
        if (this.timer) window.clearTimeout(this.timer);
        this.listenerTarget = null;
        this.docTarget = null;
        this.container = null;
      }

      isPointInside(clientX, clientY) {
        if (!this.container) return false;
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      }

      updateHoverState(clientX, clientY) {
        this.isHoverInside = this.isPointInside(clientX, clientY);
        return this.isHoverInside;
      }

      setCoords(x, y) {
        if (!this.container) return;
        if (this.timer) window.clearTimeout(this.timer);
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const normalizedX = (x - rect.left) / rect.width;
        const normalizedY = (y - rect.top) / rect.height;
        this.coords.set(
          normalizedX * 2 - 1,
          -(normalizedY * 2 - 1),
        );
        this.mouseMoved = true;
        this.timer = window.setTimeout(() => {
          this.mouseMoved = false;
        }, 100);
      }

      setNormalized(x, y) {
        this.coords.set(x, y);
        this.mouseMoved = true;
      }

      handleMouseMove(event) {
        if (!this.updateHoverState(event.clientX, event.clientY)) {
          return;
        }
        this.onInteract?.();

        if (
          this.isAutoActive &&
          !this.hasUserControl &&
          !this.takeoverActive
        ) {
          if (!this.container) return;
          const rect = this.container.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const normalizedX = (event.clientX - rect.left) / rect.width;
          const normalizedY = (event.clientY - rect.top) / rect.height;
          this.takeoverFrom.copy(this.coords);
          this.takeoverTo.set(
            normalizedX * 2 - 1,
            -(normalizedY * 2 - 1),
          );
          this.takeoverStartTime = performance.now();
          this.takeoverActive = true;
          this.hasUserControl = true;
          this.isAutoActive = false;
          return;
        }

        this.setCoords(event.clientX, event.clientY);
        this.hasUserControl = true;
      }

      handleTouchStart(event) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        if (!this.updateHoverState(touch.clientX, touch.clientY)) {
          return;
        }
        this.onInteract?.();
        this.setCoords(touch.clientX, touch.clientY);
        this.hasUserControl = true;
      }

      handleTouchMove(event) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        if (!this.updateHoverState(touch.clientX, touch.clientY)) {
          return;
        }
        this.onInteract?.();
        this.setCoords(touch.clientX, touch.clientY);
      }

      handleTouchEnd() {
        this.isHoverInside = false;
      }

      handleDocumentLeave() {
        this.isHoverInside = false;
      }

      update() {
        if (this.takeoverActive) {
          const progress =
            (performance.now() - this.takeoverStartTime) /
            (this.takeoverDuration * 1000);

          if (progress >= 1) {
            this.takeoverActive = false;
            this.coords.copy(this.takeoverTo);
            this.coordsOld.copy(this.coords);
            this.diff.set(0, 0);
          } else {
            const eased =
              progress * progress * (3 - 2 * progress);
            this.coords
              .copy(this.takeoverFrom)
              .lerp(this.takeoverTo, eased);
          }
        }

        this.diff.subVectors(this.coords, this.coordsOld);
        this.coordsOld.copy(this.coords);
        if (this.coordsOld.x === 0 && this.coordsOld.y === 0) {
          this.diff.set(0, 0);
        }
        if (this.isAutoActive && !this.takeoverActive) {
          this.diff.multiplyScalar(this.autoIntensity);
        }
      }
    }

    const Mouse = new MouseClass();

    class AutoDriver {
      constructor(mouse, manager, options) {
        this.mouse = mouse;
        this.manager = manager;
        this.enabled = options.enabled;
        this.speed = options.speed;
        this.resumeDelay = options.resumeDelay || 3000;
        this.rampDurationMs = (options.rampDuration || 0) * 1000;
        this.active = false;
        this.current = new THREE.Vector2();
        this.target = new THREE.Vector2();
        this.lastTime = performance.now();
        this.activationTime = 0;
        this.margin = 0.2;
        this.direction = new THREE.Vector2();
        this.pickNewTarget();
      }

      pickNewTarget() {
        this.target.set(
          (Math.random() * 2 - 1) * (1 - this.margin),
          (Math.random() * 2 - 1) * (1 - this.margin),
        );
      }

      forceStop() {
        this.active = false;
        this.mouse.isAutoActive = false;
      }

      update() {
        if (!this.enabled) return;
        const now = performance.now();
        const idleTime = now - this.manager.lastUserInteraction;
        if (idleTime < this.resumeDelay || this.mouse.isHoverInside) {
          if (this.active) this.forceStop();
          return;
        }

        if (!this.active) {
          this.active = true;
          this.current.copy(this.mouse.coords);
          this.lastTime = now;
          this.activationTime = now;
        }

        this.mouse.isAutoActive = true;
        let deltaSeconds = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (deltaSeconds > 0.2) deltaSeconds = 0.016;

        const direction = this.direction.subVectors(
          this.target,
          this.current,
        );
        const distance = direction.length();
        if (distance < 0.01) {
          this.pickNewTarget();
          return;
        }

        direction.normalize();
        let ramp = 1;
        if (this.rampDurationMs > 0) {
          const progress = Math.min(
            1,
            (now - this.activationTime) / this.rampDurationMs,
          );
          ramp = progress * progress * (3 - 2 * progress);
        }
        const movement = Math.min(
          this.speed * deltaSeconds * ramp,
          distance,
        );
        this.current.addScaledVector(direction, movement);
        this.mouse.setNormalized(this.current.x, this.current.y);
      }
    }

    const faceVertexShader = `
      attribute vec3 position;
      uniform vec2 px;
      uniform vec2 boundarySpace;
      varying vec2 uv;
      precision highp float;

      void main() {
        vec3 pos = position;
        vec2 scale = 1.0 - boundarySpace * 2.0;
        pos.xy = pos.xy * scale;
        uv = vec2(0.5) + pos.xy * 0.5;
        gl_Position = vec4(pos, 1.0);
      }
    `;

    const lineVertexShader = `
      attribute vec3 position;
      uniform vec2 px;
      precision highp float;
      varying vec2 uv;

      void main() {
        vec3 pos = position;
        uv = 0.5 + pos.xy * 0.5;
        vec2 normal = sign(pos.xy);
        pos.xy = abs(pos.xy) - px;
        pos.xy *= normal;
        gl_Position = vec4(pos, 1.0);
      }
    `;

    const mouseVertexShader = `
      precision highp float;
      attribute vec3 position;
      attribute vec2 uv;
      uniform vec2 center;
      uniform vec2 scale;
      uniform vec2 px;
      varying vec2 vUv;

      void main() {
        vec2 pos = position.xy * scale * 2.0 * px + center;
        vUv = uv;
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `;

    const advectionFragmentShader = `
      precision highp float;
      uniform sampler2D velocity;
      uniform float dt;
      uniform bool isBFECC;
      uniform vec2 fboSize;
      uniform vec2 px;
      varying vec2 uv;

      void main() {
        vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
        if (isBFECC == false) {
          vec2 velocityOld = texture2D(velocity, uv).xy;
          vec2 positionOld = uv - velocityOld * dt * ratio;
          vec2 velocityNew = texture2D(velocity, positionOld).xy;
          gl_FragColor = vec4(velocityNew, 0.0, 0.0);
        } else {
          vec2 positionNew = uv;
          vec2 velocityOld = texture2D(velocity, uv).xy;
          vec2 positionOld = positionNew - velocityOld * dt * ratio;
          vec2 velocityNew1 = texture2D(velocity, positionOld).xy;
          vec2 positionNew2 =
            positionOld + velocityNew1 * dt * ratio;
          vec2 error = positionNew2 - positionNew;
          vec2 positionNew3 = positionNew - error / 2.0;
          vec2 velocity2 =
            texture2D(velocity, positionNew3).xy;
          vec2 positionOld2 =
            positionNew3 - velocity2 * dt * ratio;
          vec2 velocityNew2 =
            texture2D(velocity, positionOld2).xy;
          gl_FragColor = vec4(velocityNew2, 0.0, 0.0);
        }
      }
    `;

    const colorFragmentShader = `
      precision highp float;
      uniform sampler2D velocity;
      uniform sampler2D palette;
      uniform vec4 bgColor;
      varying vec2 uv;

      void main() {
        vec2 flowVelocity = texture2D(velocity, uv).xy;
        float velocityLength =
          clamp(length(flowVelocity), 0.0, 1.0);
        vec3 color =
          texture2D(palette, vec2(velocityLength, 0.5)).rgb;
        vec3 outputColor =
          mix(bgColor.rgb, color, velocityLength);
        float outputAlpha =
          mix(bgColor.a, 1.0, velocityLength);
        gl_FragColor = vec4(outputColor, outputAlpha);
      }
    `;

    const divergenceFragmentShader = `
      precision highp float;
      uniform sampler2D velocity;
      uniform float dt;
      uniform vec2 px;
      varying vec2 uv;

      void main() {
        float x0 =
          texture2D(velocity, uv - vec2(px.x, 0.0)).x;
        float x1 =
          texture2D(velocity, uv + vec2(px.x, 0.0)).x;
        float y0 =
          texture2D(velocity, uv - vec2(0.0, px.y)).y;
        float y1 =
          texture2D(velocity, uv + vec2(0.0, px.y)).y;
        float divergence = (x1 - x0 + y1 - y0) / 2.0;
        gl_FragColor = vec4(divergence / dt);
      }
    `;

    const externalForceFragmentShader = `
      precision highp float;
      uniform vec2 force;
      uniform vec2 center;
      uniform vec2 scale;
      uniform vec2 px;
      varying vec2 vUv;

      void main() {
        vec2 circle = (vUv - 0.5) * 2.0;
        float distance = 1.0 - min(length(circle), 1.0);
        distance *= distance;
        gl_FragColor = vec4(force * distance, 0.0, 1.0);
      }
    `;

    const poissonFragmentShader = `
      precision highp float;
      uniform sampler2D pressure;
      uniform sampler2D divergence;
      uniform vec2 px;
      varying vec2 uv;

      void main() {
        float p0 =
          texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
        float p1 =
          texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
        float p2 =
          texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
        float p3 =
          texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
        float divergenceValue = texture2D(divergence, uv).r;
        float newPressure =
          (p0 + p1 + p2 + p3) / 4.0 - divergenceValue;
        gl_FragColor = vec4(newPressure);
      }
    `;

    const pressureFragmentShader = `
      precision highp float;
      uniform sampler2D pressure;
      uniform sampler2D velocity;
      uniform vec2 px;
      uniform float dt;
      varying vec2 uv;

      void main() {
        float p0 =
          texture2D(pressure, uv + vec2(px.x, 0.0)).r;
        float p1 =
          texture2D(pressure, uv - vec2(px.x, 0.0)).r;
        float p2 =
          texture2D(pressure, uv + vec2(0.0, px.y)).r;
        float p3 =
          texture2D(pressure, uv - vec2(0.0, px.y)).r;
        vec2 currentVelocity = texture2D(velocity, uv).xy;
        vec2 pressureGradient =
          vec2(p0 - p1, p2 - p3) * 0.5;
        currentVelocity -= pressureGradient * dt;
        gl_FragColor = vec4(currentVelocity, 0.0, 1.0);
      }
    `;

    const viscousFragmentShader = `
      precision highp float;
      uniform sampler2D velocity;
      uniform sampler2D velocity_new;
      uniform float v;
      uniform vec2 px;
      uniform float dt;
      varying vec2 uv;

      void main() {
        vec2 oldVelocity = texture2D(velocity, uv).xy;
        vec2 new0 =
          texture2D(
            velocity_new,
            uv + vec2(px.x * 2.0, 0.0)
          ).xy;
        vec2 new1 =
          texture2D(
            velocity_new,
            uv - vec2(px.x * 2.0, 0.0)
          ).xy;
        vec2 new2 =
          texture2D(
            velocity_new,
            uv + vec2(0.0, px.y * 2.0)
          ).xy;
        vec2 new3 =
          texture2D(
            velocity_new,
            uv - vec2(0.0, px.y * 2.0)
          ).xy;
        vec2 newVelocity =
          4.0 * oldVelocity + v * dt * (new0 + new1 + new2 + new3);
        newVelocity /= 4.0 * (1.0 + v * dt);
        gl_FragColor = vec4(newVelocity, 0.0, 0.0);
      }
    `;

    class ShaderPass {
      constructor(properties) {
        this.properties = properties || {};
        this.uniforms = this.properties.material?.uniforms;
        this.scene = null;
        this.camera = null;
        this.material = null;
        this.geometry = null;
        this.plane = null;
      }

      init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        if (!this.uniforms) return;

        this.material = new THREE.RawShaderMaterial(
          this.properties.material,
        );
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.plane = new THREE.Mesh(
          this.geometry,
          this.material,
        );
        this.scene.add(this.plane);
      }

      update() {
        Common.renderer.setRenderTarget(
          this.properties.output || null,
        );
        Common.renderer.render(this.scene, this.camera);
        Common.renderer.setRenderTarget(null);
      }

      dispose() {
        this.geometry?.dispose();
        this.material?.dispose();
      }
    }

    class Advection extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertexShader,
            fragmentShader: advectionFragmentShader,
            uniforms: {
              boundarySpace: {
                value: simulationProperties.cellScale,
              },
              px: { value: simulationProperties.cellScale },
              fboSize: { value: simulationProperties.fboSize },
              velocity: {
                value: simulationProperties.source.texture,
              },
              dt: { value: simulationProperties.dt },
              isBFECC: { value: true },
            },
          },
          output: simulationProperties.destination,
        });
        this.uniforms = this.properties.material.uniforms;
        this.lineGeometry = null;
        this.lineMaterial = null;
        this.line = null;
        this.init();
      }

      init() {
        super.init();
        this.createBoundary();
      }

      createBoundary() {
        this.lineGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          -1, -1, 0,
          -1, 1, 0,
          -1, 1, 0,
          1, 1, 0,
          1, 1, 0,
          1, -1, 0,
          1, -1, 0,
          -1, -1, 0,
        ]);
        this.lineGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3),
        );
        this.lineMaterial = new THREE.RawShaderMaterial({
          vertexShader: lineVertexShader,
          fragmentShader: advectionFragmentShader,
          uniforms: this.uniforms,
        });
        this.line = new THREE.LineSegments(
          this.lineGeometry,
          this.lineMaterial,
        );
        this.scene.add(this.line);
      }

      update({ timestep, isBounce: bounce, useBFECC }) {
        this.uniforms.dt.value = timestep;
        this.line.visible = bounce;
        this.uniforms.isBFECC.value = useBFECC;
        super.update();
      }

      dispose() {
        this.lineGeometry?.dispose();
        this.lineMaterial?.dispose();
        super.dispose();
      }
    }

    class ExternalForce extends ShaderPass {
      constructor(simulationProperties) {
        super({ output: simulationProperties.destination });
        this.mouseGeometry = null;
        this.mouseMaterial = null;
        this.mouse = null;
        this.init(simulationProperties);
      }

      init(simulationProperties) {
        super.init();
        this.mouseGeometry = new THREE.PlaneGeometry(1, 1);
        this.mouseMaterial = new THREE.RawShaderMaterial({
          vertexShader: mouseVertexShader,
          fragmentShader: externalForceFragmentShader,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          uniforms: {
            px: { value: simulationProperties.cellScale },
            force: { value: new THREE.Vector2() },
            center: { value: new THREE.Vector2() },
            scale: {
              value: new THREE.Vector2(
                simulationProperties.cursorSize,
                simulationProperties.cursorSize,
              ),
            },
          },
        });
        this.mouse = new THREE.Mesh(
          this.mouseGeometry,
          this.mouseMaterial,
        );
        this.scene.add(this.mouse);
      }

      update(properties) {
        const forceX =
          (Mouse.diff.x / 2) * properties.mouseForce;
        const forceY =
          (Mouse.diff.y / 2) * properties.mouseForce;
        const cursorSizeX =
          properties.cursorSize * properties.cellScale.x;
        const cursorSizeY =
          properties.cursorSize * properties.cellScale.y;
        const centerX = Math.min(
          Math.max(
            Mouse.coords.x,
            -1 +
              cursorSizeX +
              properties.cellScale.x * 2,
          ),
          1 - cursorSizeX - properties.cellScale.x * 2,
        );
        const centerY = Math.min(
          Math.max(
            Mouse.coords.y,
            -1 +
              cursorSizeY +
              properties.cellScale.y * 2,
          ),
          1 - cursorSizeY - properties.cellScale.y * 2,
        );
        const uniforms = this.mouse.material.uniforms;
        uniforms.force.value.set(forceX, forceY);
        uniforms.center.value.set(centerX, centerY);
        uniforms.scale.value.set(
          properties.cursorSize,
          properties.cursorSize,
        );
        super.update();
      }

      dispose() {
        this.mouseGeometry?.dispose();
        this.mouseMaterial?.dispose();
        super.dispose();
      }
    }

    class Viscous extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertexShader,
            fragmentShader: viscousFragmentShader,
            uniforms: {
              boundarySpace: {
                value: simulationProperties.boundarySpace,
              },
              velocity: {
                value: simulationProperties.source.texture,
              },
              velocity_new: {
                value: simulationProperties.alternate.texture,
              },
              v: { value: simulationProperties.viscous },
              px: { value: simulationProperties.cellScale },
              dt: { value: simulationProperties.dt },
            },
          },
          output: simulationProperties.destination,
          output0: simulationProperties.alternate,
          output1: simulationProperties.destination,
        });
        this.init();
      }

      update({ viscous, iterations, timestep }) {
        let input;
        let output;
        this.uniforms.v.value = viscous;

        for (let index = 0; index < iterations; index += 1) {
          if (index % 2 === 0) {
            input = this.properties.output0;
            output = this.properties.output1;
          } else {
            input = this.properties.output1;
            output = this.properties.output0;
          }
          this.uniforms.velocity_new.value = input.texture;
          this.properties.output = output;
          this.uniforms.dt.value = timestep;
          super.update();
        }
        return output;
      }
    }

    class Divergence extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertexShader,
            fragmentShader: divergenceFragmentShader,
            uniforms: {
              boundarySpace: {
                value: simulationProperties.boundarySpace,
              },
              velocity: {
                value: simulationProperties.source.texture,
              },
              px: { value: simulationProperties.cellScale },
              dt: { value: simulationProperties.dt },
            },
          },
          output: simulationProperties.destination,
        });
        this.init();
      }

      update({ velocity }) {
        this.uniforms.velocity.value = velocity.texture;
        super.update();
      }
    }

    class Poisson extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertexShader,
            fragmentShader: poissonFragmentShader,
            uniforms: {
              boundarySpace: {
                value: simulationProperties.boundarySpace,
              },
              pressure: {
                value: simulationProperties.alternate.texture,
              },
              divergence: {
                value: simulationProperties.source.texture,
              },
              px: { value: simulationProperties.cellScale },
            },
          },
          output: simulationProperties.destination,
          output0: simulationProperties.alternate,
          output1: simulationProperties.destination,
        });
        this.init();
      }

      update({ iterations }) {
        let input;
        let output;

        for (let index = 0; index < iterations; index += 1) {
          if (index % 2 === 0) {
            input = this.properties.output0;
            output = this.properties.output1;
          } else {
            input = this.properties.output1;
            output = this.properties.output0;
          }
          this.uniforms.pressure.value = input.texture;
          this.properties.output = output;
          super.update();
        }
        return output;
      }
    }

    class Pressure extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertexShader,
            fragmentShader: pressureFragmentShader,
            uniforms: {
              boundarySpace: {
                value: simulationProperties.boundarySpace,
              },
              pressure: {
                value: simulationProperties.pressure.texture,
              },
              velocity: {
                value: simulationProperties.velocity.texture,
              },
              px: { value: simulationProperties.cellScale },
              dt: { value: simulationProperties.dt },
            },
          },
          output: simulationProperties.destination,
        });
        this.init();
      }

      update({ velocity, pressure }) {
        this.uniforms.velocity.value = velocity.texture;
        this.uniforms.pressure.value = pressure.texture;
        super.update();
      }
    }

    class Simulation {
      constructor(options) {
        this.options = {
          iterationsPoisson: 32,
          iterationsViscous: 32,
          mouseForce: 20,
          resolution: 0.5,
          cursorSize: 100,
          viscous: 30,
          isBounce: false,
          dt: 0.014,
          isViscous: false,
          BFECC: true,
          ...options,
        };
        this.renderTargets = {
          velocity0: null,
          velocity1: null,
          velocityViscous0: null,
          velocityViscous1: null,
          divergence: null,
          pressure0: null,
          pressure1: null,
        };
        this.fboSize = new THREE.Vector2();
        this.cellScale = new THREE.Vector2();
        this.boundarySpace = new THREE.Vector2();
        this.passes = [];
        this.init();
      }

      init() {
        this.calculateSize();
        this.createRenderTargets();
        this.createShaderPasses();
      }

      getFloatType() {
        const isIOS = /(iPad|iPhone|iPod)/i.test(
          navigator.userAgent,
        );
        return isIOS ? THREE.HalfFloatType : THREE.FloatType;
      }

      createRenderTargets() {
        const options = {
          type: this.getFloatType(),
          depthBuffer: false,
          stencilBuffer: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
        };

        for (const key of Object.keys(this.renderTargets)) {
          this.renderTargets[key] = new THREE.WebGLRenderTarget(
            this.fboSize.x,
            this.fboSize.y,
            options,
          );
        }
      }

      createShaderPasses() {
        this.advection = new Advection({
          cellScale: this.cellScale,
          fboSize: this.fboSize,
          dt: this.options.dt,
          source: this.renderTargets.velocity0,
          destination: this.renderTargets.velocity1,
        });
        this.externalForce = new ExternalForce({
          cellScale: this.cellScale,
          cursorSize: this.options.cursorSize,
          destination: this.renderTargets.velocity1,
        });
        this.viscous = new Viscous({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          viscous: this.options.viscous,
          source: this.renderTargets.velocity1,
          destination: this.renderTargets.velocityViscous1,
          alternate: this.renderTargets.velocityViscous0,
          dt: this.options.dt,
        });
        this.divergence = new Divergence({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          source: this.renderTargets.velocityViscous0,
          destination: this.renderTargets.divergence,
          dt: this.options.dt,
        });
        this.poisson = new Poisson({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          source: this.renderTargets.divergence,
          destination: this.renderTargets.pressure1,
          alternate: this.renderTargets.pressure0,
        });
        this.pressure = new Pressure({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          pressure: this.renderTargets.pressure0,
          velocity: this.renderTargets.velocityViscous0,
          destination: this.renderTargets.velocity0,
          dt: this.options.dt,
        });
        this.passes = [
          this.advection,
          this.externalForce,
          this.viscous,
          this.divergence,
          this.poisson,
          this.pressure,
        ];
      }

      calculateSize() {
        const width = Math.max(
          1,
          Math.round(this.options.resolution * Common.width),
        );
        const height = Math.max(
          1,
          Math.round(this.options.resolution * Common.height),
        );
        this.cellScale.set(1 / width, 1 / height);
        this.fboSize.set(width, height);
      }

      resize() {
        this.calculateSize();
        for (const target of Object.values(this.renderTargets)) {
          target.setSize(this.fboSize.x, this.fboSize.y);
        }
      }

      update() {
        if (this.options.isBounce) {
          this.boundarySpace.set(0, 0);
        } else {
          this.boundarySpace.copy(this.cellScale);
        }

        this.advection.update({
          timestep: this.options.dt,
          isBounce: this.options.isBounce,
          useBFECC: this.options.BFECC,
        });
        this.externalForce.update({
          cursorSize: this.options.cursorSize,
          mouseForce: this.options.mouseForce,
          cellScale: this.cellScale,
        });

        let velocity = this.renderTargets.velocity1;
        if (this.options.isViscous) {
          velocity = this.viscous.update({
            viscous: this.options.viscous,
            iterations: this.options.iterationsViscous,
            timestep: this.options.dt,
          });
        }

        this.divergence.update({ velocity });
        const pressure = this.poisson.update({
          iterations: this.options.iterationsPoisson,
        });
        this.pressure.update({ velocity, pressure });
      }

      dispose() {
        for (const pass of this.passes) pass.dispose();
        for (const target of Object.values(this.renderTargets)) {
          target.dispose();
        }
      }
    }

    class Output {
      constructor() {
        this.simulation = null;
        this.scene = null;
        this.camera = null;
        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.init();
      }

      init() {
        this.simulation = new Simulation();
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.material = new THREE.RawShaderMaterial({
          vertexShader: faceVertexShader,
          fragmentShader: colorFragmentShader,
          transparent: true,
          depthWrite: false,
          uniforms: {
            velocity: {
              value:
                this.simulation.renderTargets.velocity0.texture,
            },
            boundarySpace: { value: new THREE.Vector2() },
            palette: { value: paletteTexture },
            bgColor: { value: backgroundColor },
          },
        });
        this.mesh = new THREE.Mesh(
          this.geometry,
          this.material,
        );
        this.scene.add(this.mesh);
      }

      resize() {
        this.simulation.resize();
      }

      render() {
        Common.renderer.setRenderTarget(null);
        Common.renderer.render(this.scene, this.camera);
      }

      update() {
        this.simulation.update();
        this.render();
      }

      dispose() {
        this.simulation.dispose();
        this.geometry?.dispose();
        this.material?.dispose();
      }
    }

    class WebGLManager {
      constructor(properties) {
        this.properties = properties;
        this.output = null;
        this.autoDriver = null;
        this.running = false;
        this.loop = this.loop.bind(this);
        this.resize = this.resize.bind(this);

        Common.init(properties.wrapper);
        Mouse.init(properties.wrapper);
        Mouse.autoIntensity = properties.autoIntensity;
        Mouse.takeoverDuration = properties.takeoverDuration;
        this.lastUserInteraction = performance.now();
        Mouse.onInteract = () => {
          this.lastUserInteraction = performance.now();
          this.autoDriver?.forceStop();
        };
        this.autoDriver = new AutoDriver(Mouse, this, {
          enabled: properties.autoDemo,
          speed: properties.autoSpeed,
          resumeDelay: properties.autoResumeDelay,
          rampDuration: properties.autoRampDuration,
        });
        this.init();

        window.addEventListener("resize", this.resize);
        this.handleVisibilityChange = () => {
          if (document.hidden) {
            this.pause();
          } else if (isVisibleRef.current) {
            this.start();
          }
        };
        document.addEventListener(
          "visibilitychange",
          this.handleVisibilityChange,
        );
      }

      init() {
        this.properties.wrapper.prepend(
          Common.renderer.domElement,
        );
        this.output = new Output();
      }

      resize() {
        Common.resize();
        this.output.resize();
      }

      render() {
        this.autoDriver?.update();
        Mouse.update();
        Common.update();
        this.output.update();
      }

      loop() {
        if (!this.running) return;
        this.render();
        rafRef.current = requestAnimationFrame(this.loop);
      }

      start() {
        if (this.running) return;
        this.running = true;
        this.loop();
      }

      pause() {
        this.running = false;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }

      dispose() {
        this.pause();
        window.removeEventListener("resize", this.resize);
        document.removeEventListener(
          "visibilitychange",
          this.handleVisibilityChange,
        );
        Mouse.dispose();
        this.output?.dispose();
        paletteTexture.dispose();

        if (Common.renderer) {
          const canvas = Common.renderer.domElement;
          if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
          Common.renderer.dispose();
          Common.renderer.forceContextLoss();
        }
      }
    }

    const container = mountRef.current;
    container.style.position =
      container.style.position || "relative";
    container.style.overflow =
      container.style.overflow || "hidden";

    const webgl = new WebGLManager({
      wrapper: container,
      autoDemo,
      autoSpeed,
      autoIntensity,
      takeoverDuration,
      autoResumeDelay,
      autoRampDuration,
    });
    webglRef.current = webgl;

    const applyOptionsFromProps = () => {
      const simulation = webglRef.current?.output?.simulation;
      if (!simulation) return;
      const previousResolution = simulation.options.resolution;
      Object.assign(simulation.options, {
        mouseForce,
        cursorSize,
        isViscous,
        viscous,
        iterationsViscous,
        iterationsPoisson,
        dt,
        BFECC,
        resolution,
        isBounce,
      });
      if (resolution !== previousResolution) {
        simulation.resize();
      }
    };

    applyOptionsFromProps();
    webgl.start();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible =
          entry.isIntersecting && entry.intersectionRatio > 0;
        isVisibleRef.current = isVisible;
        if (!webglRef.current) return;

        if (isVisible && !document.hidden) {
          webglRef.current.start();
        } else {
          webglRef.current.pause();
        }
      },
      { threshold: [0, 0.01, 0.1] },
    );
    intersectionObserver.observe(container);
    intersectionObserverRef.current = intersectionObserver;

    const resizeObserver = new ResizeObserver(() => {
      if (!webglRef.current) return;
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = requestAnimationFrame(() => {
        webglRef.current?.resize();
      });
    });
    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return () => {
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      resizeObserverRef.current?.disconnect();
      intersectionObserverRef.current?.disconnect();
      webglRef.current?.dispose();
      webglRef.current = null;
    };
  }, [
    BFECC,
    cursorSize,
    dt,
    isBounce,
    isViscous,
    iterationsPoisson,
    iterationsViscous,
    mouseForce,
    resolution,
    viscous,
    colors,
    autoDemo,
    autoSpeed,
    autoIntensity,
    takeoverDuration,
    autoResumeDelay,
    autoRampDuration,
  ]);

  useEffect(() => {
    const webgl = webglRef.current;
    const simulation = webgl?.output?.simulation;
    if (!simulation) return;
    const previousResolution = simulation.options.resolution;

    Object.assign(simulation.options, {
      mouseForce,
      cursorSize,
      isViscous,
      viscous,
      iterationsViscous,
      iterationsPoisson,
      dt,
      BFECC,
      resolution,
      isBounce,
    });

    if (webgl.autoDriver) {
      webgl.autoDriver.enabled = autoDemo;
      webgl.autoDriver.speed = autoSpeed;
      webgl.autoDriver.resumeDelay = autoResumeDelay;
      webgl.autoDriver.rampDurationMs =
        autoRampDuration * 1000;
      webgl.autoDriver.mouse.autoIntensity = autoIntensity;
      webgl.autoDriver.mouse.takeoverDuration =
        takeoverDuration;
    }

    if (resolution !== previousResolution) {
      simulation.resize();
    }
  }, [
    BFECC,
    cursorSize,
    dt,
    isBounce,
    isViscous,
    iterationsPoisson,
    iterationsViscous,
    mouseForce,
    resolution,
    viscous,
    autoDemo,
    autoSpeed,
    autoIntensity,
    takeoverDuration,
    autoResumeDelay,
    autoRampDuration,
  ]);

  return (
    <div
      ref={mountRef}
      className={`liquid-ether-container ${className}`}
      style={style}
    />
  );
}
