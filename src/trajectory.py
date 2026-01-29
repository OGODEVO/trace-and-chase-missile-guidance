import numpy as np

from .config import ScenarioConfig


def _curve_position(tc, config, curve_start, center, radius):
    angle = tc * config.turn_angle / config.curve_time
    arc_angle = -np.pi / 2 + angle
    x = center[0] + radius * np.cos(arc_angle)
    arc_term = radius * np.sin(arc_angle)
    climb_term = (
        np.cos(config.yz_angle + np.pi / 2)
        * config.targ_vel**2
        * (1 - np.cos(np.pi * tc / config.curve_time))
        * config.climb_rate_curve
    )
    y = center[1] + arc_term * np.cos(config.yz_angle) + climb_term
    z = center[2] + arc_term * np.sin(config.yz_angle) + climb_term * np.tan(config.yz_angle)
    return np.array([x, y, z])


def target_location(t, config, cache):
    if 0 <= t <= config.straight_time:
        x = config.aircraft_start_loc[0] + config.targ_vel * t
        y = config.aircraft_start_loc[1]
        z = config.aircraft_start_loc[2]
        return np.array([x, y, z])

    if config.straight_time < t <= config.straight_time + config.curve_time:
        tc = t - config.straight_time
        return _curve_position(tc, config, cache["curve_start"], cache["center"], cache["radius"])

    if config.straight_time + config.curve_time < t <= config.straight_time + config.curve_time + config.straight_time2:
        ts = t - (config.straight_time + config.curve_time)
        dx = np.cos(config.turn_angle)
        dy = np.sin(config.turn_angle) * np.cos(config.yz_angle)
        dz = np.sin(config.turn_angle) * np.sin(config.yz_angle)
        return cache["straight2_start"] + config.targ_vel * ts * np.array([dx, dy, dz])

    ts_max = config.straight_time2
    dx = np.cos(config.turn_angle)
    dy = np.sin(config.turn_angle) * np.cos(config.yz_angle)
    dz = np.sin(config.turn_angle) * np.sin(config.yz_angle)
    return cache["straight2_start"] + config.targ_vel * ts_max * np.array([dx, dy, dz])


def compute_target_states(times, config: ScenarioConfig):
    curve_start = config.aircraft_start_loc + np.array([config.targ_vel * config.straight_time, 0.0, 0.0])
    radius = (config.targ_vel * config.curve_time) / config.turn_angle
    center = np.array(
        [
            curve_start[0],
            curve_start[1] + radius * np.cos(config.yz_angle),
            curve_start[2] + radius * np.sin(config.yz_angle),
        ]
    )
    straight2_start = _curve_position(config.curve_time, config, curve_start, center, radius)
    cache = {
        "curve_start": curve_start,
        "radius": radius,
        "center": center,
        "straight2_start": straight2_start,
    }

    target_states = np.zeros((len(times), 3))
    for i, t in enumerate(times):
        target_states[i] = target_location(t, config, cache)

    print(f"Generated {len(times)} trajectory points over {times[-1]:.1f} seconds")
    print(f"Aircraft start @ {config.aircraft_start_loc}")
    print(
        f"First curve start approx ({curve_start[0]:.1f}, {curve_start[1]:.1f}, {curve_start[2]:.1f})"
    )
    return target_states, cache
