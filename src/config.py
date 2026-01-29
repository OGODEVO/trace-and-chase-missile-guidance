from __future__ import annotations

from dataclasses import dataclass, field
import numpy as np


@dataclass(frozen=True)
class ScenarioConfig:
    # Target aircraft
    straight_time: float = 25.0
    curve_time: float = 25.0
    straight_time2: float = 25.0
    targ_vel: float = 750.0
    turn_angle: float = -np.pi * 4 / 3
    yz_angle: float = -np.pi / 12
    climb_rate_curve: float = -0.001
    aircraft_start_loc: np.ndarray = field(default_factory=lambda: np.array([0.0, 0.0, 12000.0]))

    # Hypersonic attacker
    attack_vel: float = 1800.0
    attack_turn_rate: float = np.deg2rad(8)
    attack_kill_dist: float = 30.0
    attack_launch_time: float = 5.0
    attack_start_loc: np.ndarray = field(default_factory=lambda: np.array([-40000.0, -10000.0, 5000.0]))

    # Defender missile
    defense_vel: float = 1300.0
    defense_turn_rate: float = np.deg2rad(20)
    defense_kill_dist: float = 20.0
    defense_start_loc: np.ndarray = field(default_factory=lambda: np.array([5000.0, -2000.0, 0.0]))
    defense_launch_delay: float = 3.0
    defense_detection_radius: float = 60000.0

    # Simulation / animation
    tmax: float = 90.0
    dt: float = 0.02
    animation_interval: int = 20
