// Ported from src/math3d.py - Vector utilities

export type Vec3 = [number, number, number];

export function add(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(v: Vec3, s: number): Vec3 {
    return [v[0] * s, v[1] * s, v[2] * s];
}

export function length(v: Vec3): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

export function normalize(v: Vec3, fallback?: Vec3): Vec3 {
    const len = length(v);
    if (len < 1e-9) {
        return fallback ?? [1, 0, 0];
    }
    return [v[0] / len, v[1] / len, v[2] / len];
}

export function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

/**
 * Rotate heading towards desired direction by at most maxAngle radians
 * Ported from Python: rotate_towards(current, desired, max_angle)
 */
export function rotateTowards(
    current: Vec3,
    desired: Vec3,
    maxAngle: number
): Vec3 {
    const currentNorm = normalize(current);
    const desiredNorm = normalize(desired);

    // Angle between current and desired
    const cosAngle = Math.max(-1, Math.min(1, dot(currentNorm, desiredNorm)));
    const angle = Math.acos(cosAngle);

    if (angle < 1e-6) {
        return currentNorm;
    }

    // Clamp rotation to maxAngle
    const t = Math.min(1, maxAngle / angle);

    // SLERP-like interpolation
    const sinAngle = Math.sin(angle);
    if (sinAngle < 1e-6) {
        return currentNorm;
    }

    const a = Math.sin((1 - t) * angle) / sinAngle;
    const b = Math.sin(t * angle) / sinAngle;

    return normalize([
        a * currentNorm[0] + b * desiredNorm[0],
        a * currentNorm[1] + b * desiredNorm[1],
        a * currentNorm[2] + b * desiredNorm[2],
    ]);
}

export function distance(a: Vec3, b: Vec3): number {
    return length(sub(a, b));
}
