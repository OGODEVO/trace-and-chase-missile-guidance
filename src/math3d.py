import numpy as np


def normalize(vec, default=None):
    """Return a unit vector, falling back to default if the norm is tiny."""
    fallback = np.array(default if default is not None else [1.0, 0.0, 0.0], dtype=float)
    norm = np.linalg.norm(vec)
    if norm < 1e-9:
        return fallback.copy()
    return vec / norm


def rotate_vector(vec, axis, angle):
    axis = normalize(axis)
    cos_t = np.cos(angle)
    sin_t = np.sin(angle)
    return (
        vec * cos_t
        + np.cross(axis, vec) * sin_t
        + axis * np.dot(axis, vec) * (1 - cos_t)
    )


def rotate_towards(current_dir, desired_dir, max_angle):
    """Rotate current_dir toward desired_dir, respecting a max angular step."""
    current_dir = normalize(current_dir)
    desired_dir = normalize(desired_dir, default=current_dir)
    dot = np.clip(np.dot(current_dir, desired_dir), -1.0, 1.0)
    angle = np.arccos(dot)
    if angle < 1e-6:
        return desired_dir
    step = min(max_angle, angle)
    axis = np.cross(current_dir, desired_dir)
    if np.linalg.norm(axis) < 1e-8:
        fallback = np.array([1.0, 0.0, 0.0]) if abs(current_dir[0]) < 0.9 else np.array([0.0, 1.0, 0.0])
        axis = np.cross(current_dir, fallback)
    rotated = rotate_vector(current_dir, axis, step)
    return normalize(rotated)
