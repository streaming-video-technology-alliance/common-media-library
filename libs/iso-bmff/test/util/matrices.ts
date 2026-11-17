// The stored integers of transformation matrices.

export const IDENTITY: number[] = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000]

// A rotation of 90 degrees with a horizontal translation of 1080.
export const ROTATION: number[] = [0, 0x10000, 0, -0x10000, 0, 0, 1080 * 0x10000, 0, 0x40000000]

// The entries u and v are -0.5 and 1.5.
export const PROJECTION: number[] = [
	0x10000, 0, -0x20000000, 0, 0x10000, 0x60000000, 0, 0, 0x40000000,
]

// The entries a, b, u, and v hold the smallest and the largest stored integers.
export const LIMITS: number[] = [
	-0x80000000, 0x7fffffff, -0x80000000, 0, 0x10000, 0x7fffffff, 0, 0, 0x40000000,
]
