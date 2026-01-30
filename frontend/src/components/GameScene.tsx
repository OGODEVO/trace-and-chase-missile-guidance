"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GameState } from "../game/engine";
import { Aircraft, Missile, Explosion } from "./Meshes";
import { Vec3 } from "../game/math3d";

interface GameSceneProps {
    state: GameState;
}

function toThreePos(pos: Vec3): [number, number, number] {
    return [pos[0] / 1000, pos[2] / 1000, -pos[1] / 1000];
}

function Scene({ state }: GameSceneProps) {
    const [camX, camY, camZ] = toThreePos(state.aircraft.position);

    return (
        <>
            {/* Camera follows aircraft */}
            <PerspectiveCamera
                makeDefault
                position={[camX - 8, camY + 4, camZ + 5]}
                fov={60}
            />

            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow />

            {/* Environment */}
            <Stars radius={300} depth={100} count={5000} fade speed={0.5} />
            <fog attach="fog" args={["#0a1628", 50, 300]} />

            {/* Ground plane (far below) */}
            <mesh position={[0, -12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial color="#0a2818" />
            </mesh>

            {/* Entities */}
            <Aircraft entity={state.aircraft} />
            <Missile
                entity={state.attacker}
                color="#ff4400"
                trailColor="#ff6622"
                scale={1.2}
            />
            <Missile
                entity={state.defender}
                color="#00ff88"
                trailColor="#22ff99"
                scale={1}
            />

            {/* Explosion effects */}
            {state.aircraftDestroyed && (
                <Explosion position={state.aircraft.position} progress={0.5} />
            )}
            {state.attackerDestroyed && (
                <Explosion position={state.attacker.position} progress={0.5} />
            )}

            {/* Post-processing */}
            <EffectComposer>
                <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.8} />
            </EffectComposer>

            <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={5}
                maxDistance={50}
                target={[camX, camY, camZ]}
            />
        </>
    );
}

export default function GameScene({ state }: GameSceneProps) {
    return (
        <Canvas
            className="w-full h-full"
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
        >
            <color attach="background" args={["#0a1628"]} />
            <Scene state={state} />
        </Canvas>
    );
}
