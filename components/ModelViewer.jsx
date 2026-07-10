"use client";

/* eslint-disable react/no-unknown-property */
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  Canvas,
  invalidate,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { getNormalizedModelTransform } from "./modelBackground";

const isTouch =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);
const deg2rad = (degrees) => (degrees * Math.PI) / 180;
const DECIDE = 8;
const ROTATE_SPEED = 0.005;
const INERTIA = 0.925;
const PARALLAX_MAG = 0.05;
const PARALLAX_EASE = 0.12;
const HOVER_MAG = deg2rad(6);
const HOVER_EASE = 0.15;
const DEFAULT_SIZE = /** @type {number | string} */ (400);

function Loader({ placeholderSrc }) {
  const { progress, active } = useProgress();

  if (!active && placeholderSrc) return null;

  return (
    <Html center>
      {placeholderSrc ? (
        <img
          alt=""
          src={placeholderSrc}
          width={128}
          height={128}
          style={{ filter: "blur(8px)", borderRadius: 8 }}
        />
      ) : (
        `${Math.round(progress)} %`
      )}
    </Html>
  );
}

function DesktopControls({ pivot, min, max, zoomEnabled }) {
  const controlsRef = useRef(null);

  useFrame(() => controlsRef.current?.target.copy(pivot));

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableRotate={false}
      enableZoom={zoomEnabled}
      minDistance={min}
      maxDistance={max}
    />
  );
}

function ModelInner({
  url,
  xOff,
  yOff,
  modelScale,
  rotationResetKey,
  pivot,
  initYaw,
  initPitch,
  minZoom,
  maxZoom,
  enableMouseParallax,
  enableManualRotation,
  manualRotationTarget,
  enableHoverRotation,
  enableManualZoom,
  autoFrame,
  fadeIn,
  autoRotate,
  autoRotateSpeed,
  onLoaded,
}) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const { camera, gl } = useThree();
  const { scene } = useGLTF(url);
  const content = useMemo(() => scene.clone(true), [scene]);

  const velocityRef = useRef({ x: 0, y: 0 });
  const targetParallaxRef = useRef({ x: 0, y: 0 });
  const currentParallaxRef = useRef({ x: 0, y: 0 });
  const targetHoverRef = useRef({ x: 0, y: 0 });
  const currentHoverRef = useRef({ x: 0, y: 0 });
  const pivotWorldRef = useRef(new THREE.Vector3());
  const normalizationRef = useRef(null);
  const modelScaleRef = useRef(modelScale);
  modelScaleRef.current = modelScale;

  useLayoutEffect(() => {
    const group = innerRef.current;
    const outer = outerRef.current;

    if (!group || !outer) return undefined;

    outer.position.set(0, 0, 0);
    outer.rotation.set(0, 0, 0);
    group.position.set(0, 0, 0);
    group.scale.setScalar(1);
    group.updateWorldMatrix(true, true);

    const sphere = new THREE.Box3()
      .setFromObject(group)
      .getBoundingSphere(new THREE.Sphere());
    const transform = getNormalizedModelTransform(
      sphere.center,
      sphere.radius,
      modelScaleRef.current,
    );
    normalizationRef.current = {
      center: sphere.center.clone(),
      radius: sphere.radius,
    };

    group.scale.setScalar(transform.scale);
    group.position.set(
      transform.position.x,
      transform.position.y,
      transform.position.z,
    );

    group.traverse((object) => {
      if (!object.isMesh) return;

      object.castShadow = true;
      object.receiveShadow = true;

      if (fadeIn) {
        object.material = Array.isArray(object.material)
          ? object.material.map((material) => material.clone())
          : object.material.clone();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach((material) => {
          material.transparent = true;
          material.opacity = 0;
        });
      }
    });

    group.updateWorldMatrix(true, true);
    outer.getWorldPosition(pivotWorldRef.current);
    pivot.copy(pivotWorldRef.current);
    outer.rotation.set(initPitch, initYaw, 0);

    if (autoFrame && camera.isPerspectiveCamera) {
      const fitRadius = sphere.radius * transform.scale;
      const distance =
        (fitRadius * 1.2) /
        Math.sin((camera.fov * Math.PI) / 180 / 2);

      camera.position.set(
        pivotWorldRef.current.x,
        pivotWorldRef.current.y,
        pivotWorldRef.current.z + distance,
      );
      camera.near = distance / 10;
      camera.far = distance * 10;
      camera.updateProjectionMatrix();
    }

    if (!fadeIn) {
      onLoaded?.();
      return undefined;
    }

    let opacity = 0;
    const intervalId = window.setInterval(() => {
      opacity = Math.min(opacity + 0.05, 1);

      group.traverse((object) => {
        if (!object.isMesh) return;

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => {
          material.opacity = opacity;
        });
      });

      invalidate();

      if (opacity === 1) {
        window.clearInterval(intervalId);
        onLoaded?.();
      }
    }, 16);

    return () => window.clearInterval(intervalId);
  }, [
    autoFrame,
    camera,
    content,
    fadeIn,
    initPitch,
    initYaw,
    onLoaded,
    pivot,
  ]);

  useEffect(() => {
    const group = innerRef.current;
    const normalization = normalizationRef.current;

    if (!group || !normalization) return;

    const transform = getNormalizedModelTransform(
      normalization.center,
      normalization.radius,
      modelScale,
    );

    group.scale.setScalar(transform.scale);
    group.position.set(
      transform.position.x,
      transform.position.y,
      transform.position.z,
    );
    group.updateWorldMatrix(true, true);
    invalidate();
  }, [modelScale]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    outer.rotation.set(initPitch, initYaw, 0);
    velocityRef.current = { x: 0, y: 0 };
    targetHoverRef.current = { x: 0, y: 0 };
    currentHoverRef.current = { x: 0, y: 0 };
    invalidate();
  }, [initPitch, initYaw, rotationResetKey]);

  useEffect(() => {
    if (!enableManualRotation || isTouch) return undefined;

    const pointerTarget =
      manualRotationTarget === "window" ? window : gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const handlePointerUp = () => {
      dragging = false;
    };

    const handlePointerDown = (event) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }

      if (
        manualRotationTarget === "window" &&
        event.target instanceof Element &&
        event.target.closest(
          "a, button, input, select, textarea, [data-model-controls]",
        )
      ) {
        return;
      }

      event.preventDefault();
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      window.addEventListener("pointerup", handlePointerUp);
    };

    const handlePointerMove = (event) => {
      if (!dragging || !outerRef.current) return;

      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      outerRef.current.rotation.y += deltaX * ROTATE_SPEED;
      outerRef.current.rotation.x += deltaY * ROTATE_SPEED;
      velocityRef.current = {
        x: deltaX * ROTATE_SPEED,
        y: deltaY * ROTATE_SPEED,
      };
      invalidate();
    };

    pointerTarget.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      pointerTarget.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [enableManualRotation, gl, manualRotationTarget]);

  useEffect(() => {
    if (!isTouch) return undefined;

    const element = gl.domElement;
    const pointers = new Map();
    let mode = "idle";
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let startDistance = 0;
    let startCameraZ = 0;

    const handlePointerDown = (event) => {
      if (event.pointerType !== "touch") return;

      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (pointers.size === 1) {
        mode = "decide";
        startX = lastX = event.clientX;
        startY = lastY = event.clientY;
      } else if (pointers.size === 2 && enableManualZoom) {
        mode = "pinch";
        const [first, second] = [...pointers.values()];
        startDistance = Math.hypot(
          first.x - second.x,
          first.y - second.y,
        );
        startCameraZ = camera.position.z;
        event.preventDefault();
      }

      invalidate();
    };

    const handlePointerMove = (event) => {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return;

      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (mode === "decide") {
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        if (Math.abs(deltaX) > DECIDE || Math.abs(deltaY) > DECIDE) {
          if (enableManualRotation && Math.abs(deltaX) > Math.abs(deltaY)) {
            mode = "rotate";
            element.setPointerCapture(event.pointerId);
          } else {
            mode = "idle";
            pointers.clear();
          }
        }
      }

      if (mode === "rotate" && outerRef.current) {
        event.preventDefault();
        const deltaX = event.clientX - lastX;
        const deltaY = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        outerRef.current.rotation.y += deltaX * ROTATE_SPEED;
        outerRef.current.rotation.x += deltaY * ROTATE_SPEED;
        velocityRef.current = {
          x: deltaX * ROTATE_SPEED,
          y: deltaY * ROTATE_SPEED,
        };
        invalidate();
      } else if (mode === "pinch" && pointers.size === 2) {
        event.preventDefault();
        const [first, second] = [...pointers.values()];
        const distance = Math.hypot(
          first.x - second.x,
          first.y - second.y,
        );
        const ratio = startDistance / distance;
        camera.position.z = THREE.MathUtils.clamp(
          startCameraZ * ratio,
          minZoom,
          maxZoom,
        );
        invalidate();
      }
    };

    const handlePointerUp = (event) => {
      pointers.delete(event.pointerId);
      if (mode === "rotate" && pointers.size === 0) mode = "idle";
      if (mode === "pinch" && pointers.size < 2) mode = "idle";
    };

    element.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp, {
      passive: true,
    });
    window.addEventListener("pointercancel", handlePointerUp, {
      passive: true,
    });

    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [
    camera,
    enableManualRotation,
    enableManualZoom,
    gl,
    maxZoom,
    minZoom,
  ]);

  useEffect(() => {
    if (isTouch) return undefined;

    const handlePointerMove = (event) => {
      if (event.pointerType !== "mouse") return;

      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;

      if (enableMouseParallax) {
        targetParallaxRef.current = {
          x: -normalizedX * PARALLAX_MAG,
          y: -normalizedY * PARALLAX_MAG,
        };
      }

      if (enableHoverRotation) {
        targetHoverRef.current = {
          x: normalizedY * HOVER_MAG,
          y: normalizedX * HOVER_MAG,
        };
      }

      invalidate();
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [enableHoverRotation, enableMouseParallax]);

  useFrame((_, deltaTime) => {
    const outer = outerRef.current;
    if (!outer) return;

    let needsNextFrame = false;
    const currentParallax = currentParallaxRef.current;
    const targetParallax = targetParallaxRef.current;
    const currentHover = currentHoverRef.current;
    const targetHover = targetHoverRef.current;
    const previousHoverX = currentHover.x;
    const previousHoverY = currentHover.y;

    currentParallax.x +=
      (targetParallax.x - currentParallax.x) * PARALLAX_EASE;
    currentParallax.y +=
      (targetParallax.y - currentParallax.y) * PARALLAX_EASE;
    currentHover.x += (targetHover.x - currentHover.x) * HOVER_EASE;
    currentHover.y += (targetHover.y - currentHover.y) * HOVER_EASE;

    const projectedPivot = pivotWorldRef.current.clone().project(camera);
    projectedPivot.x += xOff + currentParallax.x;
    projectedPivot.y += yOff + currentParallax.y;
    outer.position.copy(projectedPivot.unproject(camera));

    outer.rotation.x += currentHover.x - previousHoverX;
    outer.rotation.y += currentHover.y - previousHoverY;

    if (autoRotate) {
      outer.rotation.y += autoRotateSpeed * deltaTime;
      needsNextFrame = true;
    }

    outer.rotation.y += velocityRef.current.x;
    outer.rotation.x += velocityRef.current.y;
    velocityRef.current.x *= INERTIA;
    velocityRef.current.y *= INERTIA;

    if (
      Math.abs(velocityRef.current.x) > 0.0001 ||
      Math.abs(velocityRef.current.y) > 0.0001 ||
      Math.abs(currentParallax.x - targetParallax.x) > 0.0001 ||
      Math.abs(currentParallax.y - targetParallax.y) > 0.0001 ||
      Math.abs(currentHover.x - targetHover.x) > 0.0001 ||
      Math.abs(currentHover.y - targetHover.y) > 0.0001
    ) {
      needsNextFrame = true;
    }

    if (needsNextFrame) invalidate();
  });

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>
        <primitive object={content} />
      </group>
    </group>
  );
}

export default function ModelViewer({
  url,
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  modelXOffset = 0,
  modelYOffset = 0,
  modelScale = 1,
  rotationResetKey = 0,
  defaultRotationX = -50,
  defaultRotationY = 20,
  defaultZoom = 0.5,
  minZoomDistance = 0.5,
  maxZoomDistance = 10,
  enableMouseParallax = true,
  enableManualRotation = true,
  manualRotationTarget = "canvas",
  enableHoverRotation = true,
  enableManualZoom = true,
  ambientIntensity = 0.3,
  keyLightIntensity = 1,
  fillLightIntensity = 0.5,
  rimLightIntensity = 0.8,
  environmentPreset = "forest",
  autoFrame = false,
  placeholderSrc = undefined,
  showScreenshotButton = true,
  fadeIn = false,
  autoRotate = false,
  autoRotateSpeed = 0.35,
  onModelLoaded = undefined,
}) {
  useEffect(() => {
    useGLTF.preload(url);
  }, [url]);

  const pivot = useMemo(() => new THREE.Vector3(), []);
  const contactRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const initialYaw = deg2rad(defaultRotationX);
  const initialPitch = deg2rad(defaultRotationY);
  const cameraZ = Math.min(
    Math.max(defaultZoom, minZoomDistance),
    maxZoomDistance,
  );

  const capture = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (!renderer || !scene || !camera) return;

    const shadowMapEnabled = renderer.shadowMap.enabled;
    renderer.shadowMap.enabled = false;
    const lightStates = [];

    scene.traverse((object) => {
      if (object.isLight && "castShadow" in object) {
        lightStates.push({ light: object, castShadow: object.castShadow });
        object.castShadow = false;
      }
    });

    if (contactRef.current) contactRef.current.visible = false;
    renderer.render(scene, camera);

    const imageUrl = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "model.png";
    link.href = imageUrl;
    link.click();

    renderer.shadowMap.enabled = shadowMapEnabled;
    lightStates.forEach(({ light, castShadow }) => {
      light.castShadow = castShadow;
    });
    if (contactRef.current) contactRef.current.visible = true;
    invalidate();
  };

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        touchAction: "pan-y pinch-zoom",
      }}
    >
      {showScreenshotButton && (
        <button
          type="button"
          onClick={capture}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            cursor: "pointer",
            padding: "8px 16px",
            border: "1px solid #fff",
            borderRadius: 10,
          }}
        >
          Take Screenshot
        </button>
      )}

      <Canvas
        shadows
        frameloop="demand"
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl, scene, camera }) => {
          rendererRef.current = gl;
          sceneRef.current = scene;
          cameraRef.current = camera;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        camera={{
          fov: 50,
          position: [0, 0, cameraZ],
          near: 0.01,
          far: 100,
        }}
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        {environmentPreset !== "none" && (
          <Environment preset={environmentPreset} background={false} />
        )}

        <ambientLight intensity={ambientIntensity} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={keyLightIntensity}
          castShadow
        />
        <directionalLight
          position={[-5, 2, 5]}
          intensity={fillLightIntensity}
        />
        <directionalLight
          position={[0, 4, -5]}
          intensity={rimLightIntensity}
        />

        <ContactShadows
          ref={contactRef}
          position={[0, -0.5, 0]}
          opacity={0.35}
          scale={10}
          blur={2}
        />

        <Suspense fallback={<Loader placeholderSrc={placeholderSrc} />}>
          <ModelInner
            url={url}
            xOff={modelXOffset}
            yOff={modelYOffset}
            modelScale={modelScale}
            rotationResetKey={rotationResetKey}
            pivot={pivot}
            initYaw={initialYaw}
            initPitch={initialPitch}
            minZoom={minZoomDistance}
            maxZoom={maxZoomDistance}
            enableMouseParallax={enableMouseParallax}
            enableManualRotation={enableManualRotation}
            manualRotationTarget={manualRotationTarget}
            enableHoverRotation={enableHoverRotation}
            enableManualZoom={enableManualZoom}
            autoFrame={autoFrame}
            fadeIn={fadeIn}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            onLoaded={onModelLoaded}
          />
        </Suspense>

        {!isTouch && (
          <DesktopControls
            pivot={pivot}
            min={minZoomDistance}
            max={maxZoomDistance}
            zoomEnabled={enableManualZoom}
          />
        )}
      </Canvas>
    </div>
  );
}
