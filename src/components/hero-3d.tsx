"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Stars } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

function AnimatedSphere() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <Sphere args={[1, 64, 64]} scale={1.2}>
                <MeshDistortMaterial
                    color={isDark ? "#8b5cf6" : "#3b82f6"} // Purple in dark, Blue in light
                    envMapIntensity={1}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    roughness={0.2}
                    metalness={0.8}
                    distort={0.4}
                    speed={2}
                />
            </Sphere>
        </Float>
    );
}

function FloatingRing() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const ringRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (ringRef.current) {
            ringRef.current.rotation.x = clock.getElapsedTime() * 0.2;
            ringRef.current.rotation.y = clock.getElapsedTime() * 0.3;
        }
    });

    return (
        <mesh ref={ringRef} scale={1.8}>
            <torusGeometry args={[1, 0.05, 16, 100]} />
            <meshStandardMaterial
                color={isDark ? "#ffffff" : "#000000"}
                roughness={0.1}
                metalness={0.8}
                wireframe
                transparent
                opacity={isDark ? 0.3 : 0.6}
            />
        </mesh>
    );
}

export function Hero3D() {
    return (
        <div className="w-full h-full min-h-[400px] md:min-h-[500px] relative">
            <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />

                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

                <AnimatedSphere />
                <FloatingRing />

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                />
            </Canvas>
        </div>
    );
}
