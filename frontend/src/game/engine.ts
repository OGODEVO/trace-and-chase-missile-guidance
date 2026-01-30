// Game Engine - Ported from src/sim.py
// Real-time missile guidance simulation

import { GameConfig, defaultConfig } from "./config";
import {
    Vec3,
    add,
    sub,
    scale,
    normalize,
    rotateTowards,
    distance,
} from "./math3d";

export interface Entity {
    position: Vec3;
    heading: Vec3;
    active: boolean;
    trail: Vec3[];
}

export interface GameState {
    time: number;
    aircraft: Entity;
    attacker: Entity;
    defender: Entity;
    attackerLaunched: boolean;
    defenderLaunched: boolean;
    attackerDestroyed: boolean;
    aircraftDestroyed: boolean;
    defenderDetectionTime: number | null;
    outcome: "playing" | "aircraft_destroyed" | "attacker_intercepted" | "escaped";
    score: number;
}

export type InputState = {
    pitchUp: boolean;
    pitchDown: boolean;
    yawLeft: boolean;
    yawRight: boolean;
    rollLeft: boolean;
    rollRight: boolean;
};

export function createInitialState(config: GameConfig = defaultConfig): GameState {
    return {
        time: 0,
        aircraft: {
            position: [...config.aircraftStartPos],
            heading: [1, 0, 0], // Flying along +X
            active: true,
            trail: [],
        },
        attacker: {
            position: [...config.attackerStartPos],
            heading: normalize(sub(config.aircraftStartPos, config.attackerStartPos)),
            active: false,
            trail: [],
        },
        defender: {
            position: [...config.defenderStartPos],
            heading: [0, 1, 0],
            active: false,
            trail: [],
        },
        attackerLaunched: false,
        defenderLaunched: false,
        attackerDestroyed: false,
        aircraftDestroyed: false,
        defenderDetectionTime: null,
        outcome: "playing",
        score: 0,
    };
}

/**
 * Update heading based on player input (pitch/yaw)
 */
function updateAircraftHeading(
    heading: Vec3,
    input: InputState,
    turnRate: number,
    dt: number
): Vec3 {
    let [hx, hy, hz] = heading;
    const turnAmount = turnRate * dt;

    // Yaw (left/right in XY plane)
    if (input.yawLeft) {
        const cos = Math.cos(turnAmount);
        const sin = Math.sin(turnAmount);
        const newHx = hx * cos - hy * sin;
        const newHy = hx * sin + hy * cos;
        hx = newHx;
        hy = newHy;
    }
    if (input.yawRight) {
        const cos = Math.cos(-turnAmount);
        const sin = Math.sin(-turnAmount);
        const newHx = hx * cos - hy * sin;
        const newHy = hx * sin + hy * cos;
        hx = newHx;
        hy = newHy;
    }

    // Pitch (up/down in XZ plane relative to heading)
    if (input.pitchUp) {
        hz = Math.min(0.8, hz + turnAmount * 0.5);
    }
    if (input.pitchDown) {
        hz = Math.max(-0.8, hz - turnAmount * 0.5);
    }

    return normalize([hx, hy, hz]);
}

/**
 * Main simulation step - ported from simulate_cat_and_mouse
 */
export function stepSimulation(
    state: GameState,
    input: InputState,
    config: GameConfig = defaultConfig
): GameState {
    const dt = config.dt;
    const newState = { ...state };
    newState.time += dt;

    // Update aircraft based on player input
    if (newState.aircraft.active) {
        newState.aircraft.heading = updateAircraftHeading(
            newState.aircraft.heading,
            input,
            config.aircraftTurnRate,
            dt
        );
        newState.aircraft.position = add(
            newState.aircraft.position,
            scale(newState.aircraft.heading, config.aircraftSpeed * dt)
        );
        // Add to trail
        newState.aircraft.trail = [
            ...newState.aircraft.trail.slice(-100),
            [...newState.aircraft.position] as Vec3,
        ];
    }

    // Launch attacker after delay
    if (!newState.attackerLaunched && newState.time >= config.attackerLaunchDelay) {
        newState.attackerLaunched = true;
        newState.attacker.active = true;
        newState.attacker.heading = normalize(
            sub(newState.aircraft.position, newState.attacker.position)
        );
    }

    // Update attacker - chase aircraft
    if (newState.attacker.active && !newState.attackerDestroyed && !newState.aircraftDestroyed) {
        const desiredDir = sub(newState.aircraft.position, newState.attacker.position);
        newState.attacker.heading = rotateTowards(
            newState.attacker.heading,
            desiredDir,
            config.attackerTurnRate * dt
        );
        newState.attacker.position = add(
            newState.attacker.position,
            scale(newState.attacker.heading, config.attackerSpeed * dt)
        );
        newState.attacker.trail = [
            ...newState.attacker.trail.slice(-100),
            [...newState.attacker.position] as Vec3,
        ];

        // Check if attacker hit aircraft
        const attackDist = distance(newState.attacker.position, newState.aircraft.position);
        if (attackDist <= config.attackerKillDist) {
            newState.aircraftDestroyed = true;
            newState.aircraft.active = false;
            newState.outcome = "aircraft_destroyed";
        }
    }

    // Defender detection
    if (
        newState.attackerLaunched &&
        !newState.attackerDestroyed &&
        newState.defenderDetectionTime === null
    ) {
        const attackerToDefenderDist = distance(
            newState.attacker.position,
            newState.defender.position
        );
        if (attackerToDefenderDist <= config.defenderDetectionRadius) {
            newState.defenderDetectionTime = newState.time;
        }
    }

    // Launch defender after detection + delay
    if (
        !newState.defenderLaunched &&
        newState.defenderDetectionTime !== null &&
        newState.time >= newState.defenderDetectionTime + config.defenderLaunchDelay
    ) {
        newState.defenderLaunched = true;
        newState.defender.active = true;
        newState.defender.heading = normalize(
            sub(newState.attacker.position, newState.defender.position)
        );
    }

    // Update defender - chase attacker
    if (newState.defender.active && !newState.attackerDestroyed && !newState.aircraftDestroyed) {
        const desiredDir = sub(newState.attacker.position, newState.defender.position);
        newState.defender.heading = rotateTowards(
            newState.defender.heading,
            desiredDir,
            config.defenderTurnRate * dt
        );
        newState.defender.position = add(
            newState.defender.position,
            scale(newState.defender.heading, config.defenderSpeed * dt)
        );
        newState.defender.trail = [
            ...newState.defender.trail.slice(-100),
            [...newState.defender.position] as Vec3,
        ];

        // Check if defender intercepted attacker
        const interceptDist = distance(newState.defender.position, newState.attacker.position);
        if (interceptDist <= config.defenderKillDist) {
            newState.attackerDestroyed = true;
            newState.attacker.active = false;
            newState.outcome = "attacker_intercepted";
            newState.score += 100;
        }
    }

    return newState;
}
