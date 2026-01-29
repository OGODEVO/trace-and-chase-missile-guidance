import numpy as np

from src.config import ScenarioConfig
from src.sim import simulate_cat_and_mouse
from src.trajectory import compute_target_states
from src.viz import run_animation


def main():
    config = ScenarioConfig()
    times = np.arange(0, config.tmax, config.dt)
    target_states, _cache = compute_target_states(times, config)
    sim_data = simulate_cat_and_mouse(times, target_states, config)
    _anim = run_animation(times, target_states, sim_data, config.animation_interval)


if __name__ == "__main__":
    main()
