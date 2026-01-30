"use client";

import { GameState } from "../game/engine";
import { Vec3 } from "../game/math3d";

interface HUDProps {
    state: GameState;
}

function formatSpeed(heading: Vec3, speed: number): string {
    const mach = speed / 343; // Speed of sound ~343 m/s
    return `MACH ${mach.toFixed(1)}`;
}

function formatAltitude(position: Vec3): string {
    const altFeet = (position[2] * 3.28084).toFixed(0);
    return `${Number(altFeet).toLocaleString()} FT`;
}

function distance(a: Vec3, b: Vec3): number {
    return Math.sqrt(
        (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
    );
}

export default function HUD({ state }: HUDProps) {
    const threatDistance = state.attacker.active
        ? distance(state.aircraft.position, state.attacker.position)
        : Infinity;
    const threatWarning = threatDistance < 5000;
    const criticalWarning = threatDistance < 2000;

    return (
        <div className="absolute inset-0 pointer-events-none font-mono text-sm">
            {/* Top left - Status */}
            <div className="absolute top-4 left-4 space-y-1">
                <div className="text-cyan-400 text-lg">TRACE & CHASE</div>
                <div className="text-gray-400">
                    TIME: {state.time.toFixed(1)}s
                </div>
                <div className="text-yellow-400">
                    SCORE: {state.score}
                </div>
            </div>

            {/* Top right - Aircraft data */}
            <div className="absolute top-4 right-4 text-right space-y-1">
                <div className="text-cyan-300">
                    {formatSpeed(state.aircraft.heading, 750)}
                </div>
                <div className="text-cyan-300">
                    ALT: {formatAltitude(state.aircraft.position)}
                </div>
            </div>

            {/* Center - Warnings */}
            {threatWarning && state.outcome === "playing" && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center">
                    <div
                        className={`text-2xl font-bold animate-pulse ${criticalWarning ? "text-red-500" : "text-orange-500"
                            }`}
                    >
                        ⚠️ MISSILE INBOUND
                    </div>
                    <div className="text-white text-lg">
                        {(threatDistance / 1000).toFixed(1)} km
                    </div>
                </div>
            )}

            {/* Game over states */}
            {state.outcome === "aircraft_destroyed" && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center">
                    <div className="text-red-500 text-4xl font-bold">DESTROYED</div>
                    <div className="text-gray-300 mt-2">Press R to restart</div>
                </div>
            )}

            {state.outcome === "attacker_intercepted" && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center">
                    <div className="text-green-400 text-4xl font-bold">INTERCEPTED!</div>
                    <div className="text-cyan-300 mt-2">Defender saved the day</div>
                    <div className="text-gray-300 mt-1">Press R to play again</div>
                </div>
            )}

            {/* Bottom left - Threat info */}
            <div className="absolute bottom-4 left-4 space-y-1">
                <div className={`${state.attackerLaunched ? "text-red-400" : "text-gray-500"}`}>
                    ATTACKER: {state.attackerLaunched ? (state.attackerDestroyed ? "DESTROYED" : "TRACKING") : "STANDBY"}
                </div>
                <div className={`${state.defenderLaunched ? "text-green-400" : "text-gray-500"}`}>
                    DEFENDER: {state.defenderLaunched ? "INTERCEPTING" : state.defenderDetectionTime ? "LAUNCHING..." : "STANDBY"}
                </div>
            </div>

            {/* Bottom center - Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 text-center">
                <div>WASD or Arrow Keys to maneuver</div>
                <div>Mouse to orbit camera | R to restart</div>
            </div>

            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 border-2 border-cyan-400 rounded-full opacity-50" />
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
        </div>
    );
}
