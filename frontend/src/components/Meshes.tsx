"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Entity } from "../game/engine";
import { Vec3 } from "../game/math3d";

interface MissileProps {
    entity: Entity;
    color: string;
    trailColor: string;
    scale?: number;
}

// Convert game coords to Three.js scale (divide by 1000 for km)
function toThreePos(pos: Vec3): [number, number, number] {
    return [pos[0] / 1000, pos[2] / 1000, -pos[1] / 1000]; // Y-up in Three.js
}

export function Aircraft({ entity }: { entity: Entity }) {
    const meshRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (!meshRef.current || !entity.active) return;
        const [x, y, z] = toThreePos(entity.position);
        meshRef.current.position.set(x, y, z);

        // Orient towards heading
        const [hx, hy, hz] = entity.heading;
        const target = new THREE.Vector3(
            x + hx / 1000,
            y + hz / 1000,
            z - hy / 1000
        );
        meshRef.current.lookAt(target);
    });

    if (!entity.active) return null;

    return (
        <group ref={meshRef}>
            {/* Fuselage */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.3, 1.5, 8]} />
                <meshStandardMaterial color="#4a9eff" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Wings */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[0.1, 1.2, 0.5]} />
                <meshStandardMaterial color="#3a8eef" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Engine glow */}
            <pointLight position={[0, -0.8, 0]} color="#00aaff" intensity={2} distance={3} />
        </group>
    );
}

export function Missile({ entity, color, trailColor, scale = 1 }: MissileProps) {
    const meshRef = useRef<THREE.Group>(null);
    const trailRef = useRef<THREE.Line>(null);

    const trailGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(300 * 3); // 100 points * 3 coords
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return geometry;
    }, []);

    useFrame(() => {
        if (!meshRef.current) return;

        if (entity.active) {
            const [x, y, z] = toThreePos(entity.position);
            meshRef.current.position.set(x, y, z);
            meshRef.current.visible = true;

            // Orient towards heading
            const [hx, hy, hz] = entity.heading;
            const target = new THREE.Vector3(
                x + hx / 1000,
                y + hz / 1000,
                z - hy / 1000
            );
            meshRef.current.lookAt(target);
        } else {
            meshRef.current.visible = false;
        }

        // Update trail
        if (trailRef.current && entity.trail.length > 1) {
            const positions = trailGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < entity.trail.length && i < 100; i++) {
                const [tx, ty, tz] = toThreePos(entity.trail[i]);
                positions[i * 3] = tx;
                positions[i * 3 + 1] = ty;
                positions[i * 3 + 2] = tz;
            }
            trailGeometry.attributes.position.needsUpdate = true;
            trailGeometry.setDrawRange(0, Math.min(entity.trail.length, 100));
        }
    });

    return (
        <>
            <group ref={meshRef} scale={scale}>
                {/* Missile body */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.15, 0.8, 6]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.5}
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>
                {/* Engine glow */}
                <pointLight position={[0, -0.4, 0]} color={color} intensity={3} distance={2} />
            </group>
            {/* Trail */}
            <line ref={trailRef as React.RefObject<THREE.Line>} geometry={trailGeometry}>
                <lineBasicMaterial color={trailColor} transparent opacity={0.6} linewidth={2} />
            </line>
        </>
    );
}

export function Explosion({ position, progress }: { position: Vec3; progress: number }) {
    const [x, y, z] = toThreePos(position);
    const size = progress * 3;
    const opacity = 1 - progress;

    if (progress >= 1) return null;

    return (
        <mesh position={[x, y, z]}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshBasicMaterial color="#ff6600" transparent opacity={opacity} />
        </mesh>
    );
}
