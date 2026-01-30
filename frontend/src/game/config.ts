// Ported from src/config.py - ScenarioConfig
// All units: meters, seconds, radians

export interface GameConfig {
    // Target aircraft
    aircraftSpeed: number;
    aircraftTurnRate: number;
    aircraftStartPos: [number, number, number];

    // Hypersonic attacker missile
    attackerSpeed: number;
    attackerTurnRate: number;
    attackerKillDist: number;
    attackerLaunchDelay: number;
    attackerStartPos: [number, number, number];

    // Defender missile
    defenderSpeed: number;
    defenderTurnRate: number;
    defenderKillDist: number;
    defenderLaunchDelay: number;
    defenderDetectionRadius: number;
    defenderStartPos: [number, number, number];

    // Simulation
    dt: number;
}

export const defaultConfig: GameConfig = {
    // Aircraft - player controlled
    aircraftSpeed: 750, // m/s (~Mach 2.2)
    aircraftTurnRate: Math.PI / 4, // 45 deg/s - responsive for gameplay
    aircraftStartPos: [0, 0, 12000],

    // Hypersonic attacker - AI enemy
    attackerSpeed: 1800, // m/s (~Mach 5.3)
    attackerTurnRate: (8 * Math.PI) / 180, // 8 deg/s from Python config
    attackerKillDist: 30,
    attackerLaunchDelay: 3.0,
    attackerStartPos: [-40000, -10000, 5000],

    // Defender - AI ally
    defenderSpeed: 1300, // m/s
    defenderTurnRate: (20 * Math.PI) / 180, // 20 deg/s
    defenderKillDist: 20,
    defenderLaunchDelay: 2.0,
    defenderDetectionRadius: 60000,
    defenderStartPos: [5000, -2000, 0],

    // Simulation timestep
    dt: 1 / 60, // 60fps
};
