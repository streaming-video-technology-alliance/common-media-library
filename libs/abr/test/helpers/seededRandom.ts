/**
 * Creates a deterministic pseudo-random generator that returns numbers in [0, 1).
 * The generator is mulberry32. Tests use it so that every run sees the same values.
 */
export function createSeededRandom(seed: number): () => number {
	let state = seed >>> 0

	return () => {
		state = (state + 0x6d2b79f5) >>> 0

		let t = state

		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}
