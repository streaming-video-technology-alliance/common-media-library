/**
 * Effective buffers in seconds of the design record, away from any threshold, with the rung that each one picks.
 * The ladders are L1 and L2 with the default buffer target.
 */
export const L1_GOLDEN: [number, number][] = [
	[0, 0],
	[3.98, 0],
	[9.35, 1],
	[11.9, 2],
	[14.22, 3],
	[20.19, 4],
]

export const L2_GOLDEN: [number, number][] = [
	[0, 0],
	[2.55, 0],
	[6.48, 1],
	[8.95, 2],
	[11.02, 3],
	[13.28, 4],
	[15.86, 5],
	[18.01, 6],
	[19.78, 7],
	[21.74, 8],
	[28.89, 9],
]
