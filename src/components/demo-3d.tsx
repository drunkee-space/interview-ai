"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Center, Edges, RoundedBox } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

function MockUI() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle floating and subtle rotation
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
        }
    });

    const [codeLinesData] = useState<{ id: number, xOffset: number, yOffset: number, width: number }[]>(() => 
        [...Array(6)].map((_, i) => ({
            id: i,
            xOffset: Math.random() * 0.5,
            yOffset: -i * 0.3,
            width: 1 + Math.random() * 1.5
        }))
    );

    const bgColor = isDark ? "#18181b" : "#ffffff";
    const panelColor = isDark ? "#27272a" : "#f4f4f5";
    const strokeColor = isDark ? "#3f3f46" : "#e4e4e7";

    return (
        <group ref={groupRef}>
            {/* Main Back Panel */}
            <RoundedBox position={[0, 0, -0.5]} args={[6, 4, 0.1]} radius={0.2} smoothness={4}>
                <meshStandardMaterial color={bgColor} roughness={0.2} metalness={0.1} />
                <Edges scale={1} color={strokeColor} />
            </RoundedBox>

            {/* Code Editor Panel (Left) */}
            <Float speed={1.5} floatIntensity={0.5} rotationIntensity={0.1}>
                <RoundedBox position={[-1.2, 0, 0]} args={[3.2, 3.2, 0.1]} radius={0.1} smoothness={4}>
                    <meshStandardMaterial color={panelColor} roughness={0.4} />
                    <Edges scale={1} color={strokeColor} />

                    {/* Mock Code Lines */}
                    <group position={[-1.3, 1.2, 0.06]}>
                        {codeLinesData.map((line) => (
                            <mesh key={line.id} position={[line.xOffset, line.yOffset, 0]}>
                                <boxGeometry args={[line.width, 0.08, 0.02]} />
                                <meshBasicMaterial color={isDark ? "#8b5cf6" : "#3b82f6"} opacity={0.7} transparent />
                            </mesh>
                        ))}
                    </group>
                </RoundedBox>
            </Float>

            {/* AI Interviewer Video Panel (Top Right) */}
            <Float speed={2} floatIntensity={0.8} rotationIntensity={0.3}>
                <RoundedBox position={[1.4, 0.6, 0.2]} args={[1.8, 1.4, 0.1]} radius={0.1} smoothness={4}>
                    <meshStandardMaterial color={panelColor} roughness={0.3} />
                    <Edges scale={1} color={strokeColor} />

                    {/* AI Avatar Sphere */}
                    <mesh position={[0, 0, 0.06]}>
                        <sphereGeometry args={[0.3, 32, 32]} />
                        <meshStandardMaterial color={isDark ? "#8b5cf6" : "#3b82f6"} emissive={isDark ? "#8b5cf6" : "#3b82f6"} emissiveIntensity={0.5} roughness={0.1} />
                    </mesh>
                </RoundedBox>
            </Float>

            {/* User Camera Panel (Bottom Right) */}
            <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.2}>
                <RoundedBox position={[1.4, -0.9, 0.1]} args={[1.8, 1.2, 0.1]} radius={0.1} smoothness={4}>
                    <meshStandardMaterial color={panelColor} roughness={0.5} />
                    <Edges scale={1} color={strokeColor} />

                    <mesh position={[0, 0, 0.06]}>
                        <circleGeometry args={[0.2, 32]} />
                        <meshBasicMaterial color={strokeColor} />
                    </mesh>
                </RoundedBox>
            </Float>
        </group>
    );
}

export function Demo3D() {
    return (
        <div className="w-full h-[500px] md:h-[600px] relative">
            <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <Center>
                    <MockUI />
                </Center>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    maxPolarAngle={Math.PI / 2 + 0.2}
                    minPolarAngle={Math.PI / 2 - 0.2}
                    maxAzimuthAngle={0.3}
                    minAzimuthAngle={-0.3}
                />
            </Canvas>
        </div>
    );
}
