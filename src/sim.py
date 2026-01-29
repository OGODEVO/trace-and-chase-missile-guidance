import numpy as np

from .config import ScenarioConfig
from .math3d import normalize, rotate_towards


def simulate_cat_and_mouse(times, target_states, config: ScenarioConfig):
    n_points = len(times)
    attack_states = np.zeros((n_points, 3))
    defense_states = np.zeros((n_points, 3))
    attack_states[0] = config.attack_start_loc
    defense_states[0] = config.defense_start_loc

    attack_heading = normalize(target_states[0] - config.attack_start_loc)
    defense_heading = normalize(config.attack_start_loc - config.defense_start_loc)

    attack_launched = False
    defense_launched = False
    attack_destroyed = False
    attack_hit_aircraft = False
    detection_time = None
    defense_launch_time_actual = None

    intercepts = {"attack_vs_aircraft": None, "defense_vs_attack": None}

    for i in range(1, n_points):
        t = times[i]
        attack_states[i] = attack_states[i - 1]
        defense_states[i] = defense_states[i - 1]

        if not attack_launched and t >= config.attack_launch_time:
            attack_launched = True
            attack_heading = normalize(target_states[i] - attack_states[i - 1], default=attack_heading)
            print(f"Hypersonic attacker launched at t = {t:.2f}s")

        if attack_launched and not attack_destroyed and not attack_hit_aircraft:
            desired_dir = target_states[i] - attack_states[i - 1]
            attack_heading = rotate_towards(attack_heading, desired_dir, config.attack_turn_rate * config.dt)
            attack_states[i] = attack_states[i - 1] + attack_heading * config.attack_vel * config.dt

        attack_distance = np.linalg.norm(target_states[i] - attack_states[i])
        if attack_launched and not attack_destroyed and not attack_hit_aircraft and attack_distance <= config.attack_kill_dist:
            attack_hit_aircraft = True
            intercepts["attack_vs_aircraft"] = i
            print(f"Aircraft destroyed at t = {t:.2f}s (distance {attack_distance:.1f} m)")

        if attack_launched and not attack_destroyed and detection_time is None:
            if attack_distance <= config.defense_detection_radius:
                detection_time = t
                print(f"Defense radar tracks attacker at t = {t:.2f}s (range {attack_distance:.0f} m)")

        if (not defense_launched) and detection_time is not None and t >= detection_time + config.defense_launch_delay:
            defense_launched = True
            defense_launch_time_actual = t
            defense_heading = normalize(attack_states[i] - defense_states[i - 1], default=defense_heading)
            print(f"Defender launched at t = {t:.2f}s")

        if defense_launched:
            if not attack_destroyed and not attack_hit_aircraft:
                desired_dir = attack_states[i] - defense_states[i - 1]
                defense_heading = rotate_towards(defense_heading, desired_dir, config.defense_turn_rate * config.dt)
                defense_states[i] = defense_states[i - 1] + defense_heading * config.defense_vel * config.dt
                defense_distance = np.linalg.norm(defense_states[i] - attack_states[i])
                if defense_distance <= config.defense_kill_dist and intercepts["defense_vs_attack"] is None:
                    attack_destroyed = True
                    intercepts["defense_vs_attack"] = i
                    print(f"Defender intercepted attacker at t = {t:.2f}s (distance {defense_distance:.1f} m)")
            else:
                defense_states[i] = defense_states[i - 1]

    final_attack_distance = np.linalg.norm(target_states[-1] - attack_states[-1])
    final_defense_distance = np.linalg.norm(attack_states[-1] - defense_states[-1])
    print(f"Final attacker distance to aircraft: {final_attack_distance:.1f} m")
    print(f"Final defender distance to attacker: {final_defense_distance:.1f} m")

    return {
        "attack_states": attack_states,
        "defense_states": defense_states,
        "attack_hit_aircraft": attack_hit_aircraft,
        "attack_destroyed": attack_destroyed,
        "intercepts": intercepts,
        "detection_time": detection_time,
        "defense_launch_time": defense_launch_time_actual,
    }
