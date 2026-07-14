/* eslint-disable react/no-unknown-property */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import {
  createLanyardRetractionState,
  getLanyardRetractionKick,
  isLanyardRetractionComplete,
  stepLanyardRetraction,
} from "@/components/lanyardRetraction";
import { withBasePath } from "@/components/sitePath";
import "./Lanyard.css";

extend({ MeshLineGeometry, MeshLineMaterial });

const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

/**
 * @typedef {Object} LanyardProps
 * @property {number[]} [position]
 * @property {number[]} [gravity]
 * @property {number} [fov]
 * @property {boolean} [transparent]
 * @property {string | null} [frontImage]
 * @property {string | null} [backImage]
 * @property {"cover" | "contain"} [imageFit]
 * @property {string | null} [lanyardImage]
 * @property {number} [lanyardWidth]
 * @property {(() => void) | null} [onReady]
 * @property {boolean} [retracting]
 * @property {(() => void) | null} [onRetractComplete]
 */

/** @param {LanyardProps} props */
export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
  onReady = null,
  retracting = false,
  onRetractComplete = null,
}) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={1}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) =>
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
        }
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            onReady={onReady}
            retracting={retracting}
            onRetractComplete={onRetractComplete}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
  onReady = null,
  retracting = false,
  onRetractComplete = null,
}) {
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const vec = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const segmentProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };
  const { nodes, materials } = useGLTF(
    withBasePath("/lanyard/card.glb"),
  );
  const texture = useTexture(
    lanyardImage || withBasePath("/lanyard/sunburst-lanyard.png"),
  );
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);
  const readyNotified = useRef(false);
  const retractionState = useRef(createLanyardRetractionState());
  const retractionKicked = useRef(false);
  const retractionCompleteNotified = useRef(false);
  const onRetractCompleteRef = useRef(onRetractComplete);

  useEffect(() => {
    onRetractCompleteRef.current = onRetractComplete;
  }, [onRetractComplete]);

  useEffect(() => {
    if (readyNotified.current) return;
    readyNotified.current = true;
    onReady?.();
  }, [onReady]);

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return baseMap;

    const baseImg = baseMap.image;
    const width = baseImg.width;
    const height = baseImg.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return baseMap;
    context.drawImage(baseImg, 0, 0, width, height);

    const drawFitted = (image, rect) => {
      const rectX = rect.x * width;
      const rectY = rect.y * height;
      const rectWidth = rect.w * width;
      const rectHeight = rect.h * height;
      const pickScale = imageFit === "contain" ? Math.min : Math.max;
      const scale = pickScale(
        rectWidth / image.width,
        rectHeight / image.height,
      );
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const drawX = rectX + (rectWidth - drawWidth) / 2;
      const drawY = rectY + (rectHeight - drawHeight) / 2;
      context.save();
      context.beginPath();
      context.rect(rectX, rectY, rectWidth, rectHeight);
      context.clip();
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      context.restore();
    };

    if (frontImage && frontTex.image) {
      drawFitted(frontTex.image, FRONT_UV_RECT);
    }
    if (backImage && backTex.image) {
      drawFitted(backTex.image, BACK_UV_RECT);
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [
    backImage,
    backTex,
    frontImage,
    frontTex,
    imageFit,
    materials.base.map,
  ]);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useEffect(() => {
    retractionState.current = createLanyardRetractionState();
    retractionKicked.current = false;
    retractionCompleteNotified.current = false;

    if (!retracting) return;

    drag(false);
    [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
  }, [retracting]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0],
  ]);

  useEffect(() => {
    if (!hovered) return undefined;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (retracting && !dragged && fixed.current && card.current) {
      if (!retractionKicked.current) {
        const kick = getLanyardRetractionKick(card.current.translation().x);
        card.current.applyImpulse(kick.impulse, true);
        card.current.applyTorqueImpulse(kick.torque, true);
        retractionKicked.current = true;
      }

      retractionState.current = stepLanyardRetraction(
        retractionState.current,
        delta,
      );
      fixed.current.setNextKinematicTranslation({
        x: 0,
        y: 4 + retractionState.current.offset,
        z: 0,
      });

      if (
        !retractionCompleteNotified.current &&
        isLanyardRetractionComplete(
          retractionState.current,
          card.current.translation().y,
        )
      ) {
        retractionCompleteNotified.current = true;
        onRetractCompleteRef.current?.();
      }
    }

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(
            ref.current.translation(),
          );
        }
        const clampedDistance = Math.max(
          0.1,
          Math.min(
            1,
            ref.current.lerped.distanceTo(ref.current.translation()),
          ),
        );
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta *
            (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(
        curve.getPoints(isMobile ? 16 : 32),
      );
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="kinematicPosition" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(event) => {
              event.target.releasePointerCapture(event.pointerId);
              drag(false);
            }}
            onPointerDown={(event) => {
              event.target.setPointerCapture(event.pointerId);
              drag(
                new THREE.Vector3()
                  .copy(event.point)
                  .sub(vec.copy(card.current.translation())),
              );
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-1, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}
