import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import numpy as np


def build_axes(target_states, attack_states, defense_states):
    fig = plt.figure(figsize=(14, 10))
    ax = fig.add_subplot(111, projection="3d")
    all_points = np.vstack([target_states, attack_states, defense_states])
    padding = 0.1
    ranges = np.ptp(all_points, axis=0)
    max_range = np.max(ranges)
    centers = (np.max(all_points, axis=0) + np.min(all_points, axis=0)) / 2
    plot_radius = max_range / 2 * (1 + padding)
    ax.set_xlim(centers[0] - plot_radius, centers[0] + plot_radius)
    ax.set_ylim(centers[1] - plot_radius, centers[1] + plot_radius)
    ax.set_zlim(centers[2] - plot_radius, centers[2] + plot_radius)
    ax.set_box_aspect([1, 1, 1])
    ax.set_xlabel("X (m)")
    ax.set_ylabel("Y (m)")
    ax.set_zlabel("Z (m)")
    ax.set_title("Trace & Chase: Hypersonic Attack vs Defense")
    ax.grid(True)
    ax.view_init(elev=25, azim=40)
    return fig, ax


def run_animation(times, target_states, sim_data, animation_interval):
    attack_states = sim_data["attack_states"]
    defense_states = sim_data["defense_states"]
    intercepts = sim_data["intercepts"]

    fig, ax = build_axes(target_states, attack_states, defense_states)

    (target_point,) = ax.plot([], [], [], "bo", markersize=8, label="Aircraft")
    (target_trail,) = ax.plot([], [], [], "b-", linewidth=2, alpha=0.6)
    (attack_point,) = ax.plot([], [], [], "ro", markersize=7, label="Hypersonic Missile")
    (attack_trail,) = ax.plot([], [], [], "r-", linewidth=1.5, alpha=0.5)
    (defense_point,) = ax.plot([], [], [], "o", color="#ff8c00", markersize=7, label="Defender")
    (defense_trail,) = ax.plot([], [], [], color="#ff8c00", linewidth=1.5, alpha=0.6)

    time_text = ax.text2D(0.02, 0.95, "", transform=ax.transAxes, fontsize=12)
    attack_text = ax.text2D(0.02, 0.90, "", transform=ax.transAxes, fontsize=10)
    defense_text = ax.text2D(0.02, 0.85, "", transform=ax.transAxes, fontsize=10)
    result_text = ax.text2D(0.02, 0.80, "", transform=ax.transAxes, fontsize=10)

    ax.scatter(target_states[0, 0], target_states[0, 1], target_states[0, 2], c="green", s=80, marker="s", label="Aircraft Start")
    ax.scatter(attack_states[0, 0], attack_states[0, 1], attack_states[0, 2], c="red", s=80, marker="^", label="Attacker Launch")
    ax.scatter(defense_states[0, 0], defense_states[0, 1], defense_states[0, 2], c="#ff8c00", s=80, marker="^", label="Defender Base")

    if intercepts["attack_vs_aircraft"] is not None:
        idx = intercepts["attack_vs_aircraft"]
        ax.scatter(
            target_states[idx, 0],
            target_states[idx, 1],
            target_states[idx, 2],
            c="purple",
            s=120,
            marker="X",
            label="Aircraft Hit",
        )
    if intercepts["defense_vs_attack"] is not None:
        idx = intercepts["defense_vs_attack"]
        ax.scatter(
            attack_states[idx, 0],
            attack_states[idx, 1],
            attack_states[idx, 2],
            c="#ffa500",
            s=140,
            marker="*",
            label="Intercept",
        )

    ax.legend(loc="upper right")

    def init():
        target_point.set_data([], [])
        target_point.set_3d_properties([])
        target_trail.set_data([], [])
        target_trail.set_3d_properties([])
        attack_point.set_data([], [])
        attack_point.set_3d_properties([])
        attack_trail.set_data([], [])
        attack_trail.set_3d_properties([])
        defense_point.set_data([], [])
        defense_point.set_3d_properties([])
        defense_trail.set_data([], [])
        defense_trail.set_3d_properties([])
        time_text.set_text("")
        attack_text.set_text("")
        defense_text.set_text("")
        result_text.set_text("")
        return (
            target_point,
            target_trail,
            attack_point,
            attack_trail,
            defense_point,
            defense_trail,
            time_text,
            attack_text,
            defense_text,
            result_text,
        )

    def update(frame):
        target_point.set_data([target_states[frame, 0]], [target_states[frame, 1]])
        target_point.set_3d_properties([target_states[frame, 2]])
        target_trail.set_data(target_states[: frame + 1, 0], target_states[: frame + 1, 1])
        target_trail.set_3d_properties(target_states[: frame + 1, 2])

        attack_point.set_data([attack_states[frame, 0]], [attack_states[frame, 1]])
        attack_point.set_3d_properties([attack_states[frame, 2]])
        attack_trail.set_data(attack_states[: frame + 1, 0], attack_states[: frame + 1, 1])
        attack_trail.set_3d_properties(attack_states[: frame + 1, 2])

        defense_point.set_data([defense_states[frame, 0]], [defense_states[frame, 1]])
        defense_point.set_3d_properties([defense_states[frame, 2]])
        defense_trail.set_data(defense_states[: frame + 1, 0], defense_states[: frame + 1, 1])
        defense_trail.set_3d_properties(defense_states[: frame + 1, 2])

        attack_distance = np.linalg.norm(target_states[frame] - attack_states[frame])
        defense_distance = np.linalg.norm(attack_states[frame] - defense_states[frame])

        time_text.set_text(f"Time = {times[frame]:.2f} s")
        attack_text.set_text(f"Attacker -> Aircraft = {attack_distance:8.1f} m")
        defense_text.set_text(f"Defender -> Attacker = {defense_distance:8.1f} m")

        if sim_data["attack_hit_aircraft"]:
            result_text.set_text("Outcome: Aircraft destroyed")
        elif sim_data["attack_destroyed"]:
            result_text.set_text("Outcome: Defender saves the day")
        else:
            result_text.set_text("Outcome: Engagement ongoing")

        return (
            target_point,
            target_trail,
            attack_point,
            attack_trail,
            defense_point,
            defense_trail,
            time_text,
            attack_text,
            defense_text,
            result_text,
        )

    frame_skip = max(1, len(times) // 600)
    frames = range(0, len(times), frame_skip)
    anim = FuncAnimation(
        fig,
        update,
        frames=frames,
        init_func=init,
        blit=False,
        interval=animation_interval,
        repeat=True,
    )
    plt.show()
    return anim
