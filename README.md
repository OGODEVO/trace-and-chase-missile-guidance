# Trace & Chase Missile Guidance

A hands-on playground for 3D missile-vs-aircraft engagements. The updated simulation now pits a hypersonic attacker against a defender missile that tries to shield the aircraft, creating a simple cat-and-mouse game built on top of the original pursuit demo.

## Features
- **Layered flight path** – aircraft still flies a straight leg, executes a banked turn, and exits on a new heading.
- **Hypersonic threat** – attacker launches after a configurable delay, flies at Mach-class speeds, and is limited by a maximum turn rate and kill radius.
- **Defender logic** – a defender missile launches once the attacker breaches the radar bubble, honors its own turn-rate limits, and attempts to intercept before the aircraft is destroyed.
- **3D visualization** – Matplotlib animation shows all tracks, start/impact markers, and continuously updated range-to-target readouts.
- **Scenario scripting** – tweak numbers (speeds, launch points, detection radii, etc.) in `trace_and_chase.py` to explore new engagements.

## Requirements
- Python 3.8+
- `numpy`
- `matplotlib`

Install deps quickly:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install numpy matplotlib
```

## Run It
```bash
python trace_and_chase.py
```
The script prints key timeline events (launches, detections, intercepts) and then opens an animated 3D window. Set `MPLBACKEND=Agg` if you are on a headless machine and want to adapt the code to save frames or MP4s instead of calling `plt.show()`.

## Key Parameters
All scenario knobs are gathered at the top of `trace_and_chase.py`:

| Variable | Description |
| --- | --- |
| `Straight_time`, `curve_time`, `Straight_time2`, `turn_angle` | Aircraft flight profile. |
| `attack_vel`, `attack_turn_rate`, `attack_launch_time`, `attack_kill_dist`, `attack_start_loc` | Hypersonic attacker performance and geometry. |
| `defense_vel`, `defense_turn_rate`, `defense_launch_delay`, `defense_detection_radius`, `defense_kill_dist`, `defense_start_loc` | Defender missile behavior and trigger logic. |
| `tmax`, `dt`, `animation_interval` | Simulation and animation resolution. |

Adjust any of these values to explore different timelines (late launches, sluggish defenders, closer intercept bubbles, etc.). Contributions that add stochastic runs, additional vehicle models, or export options are very welcome.
