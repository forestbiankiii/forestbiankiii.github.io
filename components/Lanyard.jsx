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
import { withBasePath } from "@/components/sitePath";
import "./Lanyard.css";

extend({ MeshLineGeometry, MeshLineMaterial });

const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function fittedTexture(texture, imageFit) {
  if (!texture.image || typeof document === "undefined") return texture;

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1260;
  const context = canvas.getContext("2d");
  if (!context) return texture;

  const image = texture.image;
  const pickScale = imageFit === "contain" ? Math.min : Math.max;
  const scale = pickScale(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  );

  const fitted = new THREE.CanvasTexture(canvas);
  fitted.colorSpace = THREE.SRGBColorSpace;
  fitted.anisotropy = 16;
  fitted.needsUpdate = true;
  return fitted;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardWidth = 0.92,
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
        dpr={[1, isMobile ? 1.4 : 2]}
        gl={{ alpha: transparent, antialias: !isMobile }}
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
            lanyardWidth={lanyardWidth}
          />
        </Physics>
        <Environment blur={0.8}>
          <Lightformer
            intensity={3}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={4}
            color="#d9ff9e"
            position={[-4, 1, 5]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 8, 1]}
          />
          <Lightformer
            intensity={7}
            color="white"
            position={[8, 0, 12]}
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
  lanyardWidth = 0.92,
}) {
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const vec = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const segmentProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };
  const { nodes } = useGLTF(withBasePath("/lanyard/card.glb"));
  const bandTexture = useTexture(withBasePath("/lanyard/lanyard.png"));
  const sourceFrontTexture = useTexture(frontImage || BLANK_PIXEL);
  const sourceBackTexture = useTexture(backImage || BLANK_PIXEL);
  const frontTexture = useMemo(
    () => fittedTexture(sourceFrontTexture, imageFit),
    [sourceFrontTexture, imageFit],
  );
  const backTexture = useMemo(
    () => fittedTexture(sourceBackTexture, imageFit),
    [sourceBackTexture, imageFit],
  );
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

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.23, 0],
  ]);

  useEffect(() => {
    if (!hovered) return undefined;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  useEffect(
    () => () => {
      if (frontTexture !== sourceFrontTexture) frontTexture.dispose();
      if (backTexture !== sourceBackTexture) backTexture.dispose();
    }, [frontTexture, backTexture, sourceFrontTexture, sourceBackTexture],
  );

  useFrame((state, delta) => {
    if (dragged && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (
      !fixed.current ||
      !j1.current ||
      !j2.current ||
      !j3.current ||
      !card.current ||
      !band.current
    ) {
      return;
    }

    [j1, j2].forEach((ref) => {
      if (!ref.current.lerped) {
        ref.current.lerped = new THREE.Vector3().copy(
          ref.current.translation(),
        );
      }
      const distance = ref.current.lerped.distanceTo(ref.current.translation());
      const clampedDistance = Math.max(0.1, Math.min(1, distance));
      ref.current.lerped.lerp(
        ref.current.translation(),
        delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
      );
    });

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(j2.current.lerped);
    curve.points[2].copy(j1.current.lerped);
    curve.points[3].copy(fixed.current.translation());
    band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
    ang.copy(card.current.angvel());
    rot.copy(card.current.rotation());
    card.current.setAngvel({
      x: ang.x,
      y: ang.y - rot.y * 0.25,
      z: ang.z,
    });
  });

  curve.curveType = "chordal";
  bandTexture.wrapS = bandTexture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
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
          ref={card}
          position={[2, 0, 0]}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.82, 1.16, 0.06]} />
          <group
            position={[0, -1.22, 0]}
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
                color="#f4f5ef"
                clearcoat={isMobile ? 0.45 : 1}
                clearcoatRoughness={0.16}
                roughness={0.72}
                metalness={0.08}
              />
            </mesh>
            <mesh position={[0, 0, 0.046]}>
              <planeGeometry args={[1.54, 2.16]} />
              <meshPhysicalMaterial
                map={frontTexture}
                clearcoat={0.45}
                clearcoatRoughness={0.18}
                roughness={0.7}
              />
            </mesh>
            <mesh position={[0, 0, -0.046]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[1.54, 2.16]} />
              <meshPhysicalMaterial
                map={backTexture}
                clearcoat={0.35}
                clearcoatRoughness={0.2}
                roughness={0.74}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} position={[0, 1.23, 0]}>
              <meshStandardMaterial
                color="#c9ced4"
                roughness={0.28}
                metalness={0.9}
              />
            </mesh>
            <mesh geometry={nodes.clamp.geometry} position={[0, 1.08, 0]}>
              <meshStandardMaterial
                color="#aab0b8"
                roughness={0.32}
                metalness={0.85}
              />
            </mesh>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [900, 1600] : [1200, 900]}
          useMap
          map={bandTexture}
          repeat={[-3, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}
