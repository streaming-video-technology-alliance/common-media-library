import type { LadderRung } from '@svta/cml-abr'

/**
 * Builds a ladder from bandwidths in bits per second.
 */
export function rungs(...bandwidths: number[]): LadderRung[] {
	return bandwidths.map(bandwidth => ({ bandwidth }))
}

/**
 * Returns the bandwidths of a ladder.
 */
export function bandwidthsOf(ladder: readonly LadderRung[]): number[] {
	return ladder.map(rung => rung.bandwidth)
}

/**
 * Returns a copy of a ladder with one more rung. The result stays in ascending order.
 */
export function withRung(ladder: readonly LadderRung[], bandwidth: number): LadderRung[] {
	return rungs(...[...bandwidthsOf(ladder), bandwidth].sort((a, b) => a - b))
}

/**
 * Returns a copy of a ladder without the rung at `position`.
 */
export function withoutRung(ladder: readonly LadderRung[], position: number): LadderRung[] {
	return rungs(...bandwidthsOf(ladder).filter((_, index) => index !== position))
}

/**
 * The first test ladder of the BOLA RFC: five rungs from 300 kbps to 6 Mbps.
 */
export const L1: LadderRung[] = rungs(300_000, 750_000, 1_500_000, 3_000_000, 6_000_000)

/**
 * The second test ladder of the BOLA RFC: ten rungs from 235 kbps to 5.8 Mbps.
 */
export const L2: LadderRung[] = rungs(
	235_000,
	375_000,
	560_000,
	750_000,
	1_050_000,
	1_750_000,
	2_350_000,
	3_000_000,
	4_300_000,
	5_800_000,
)

export const L1_BANDWIDTHS: number[] = bandwidthsOf(L1)

export const L2_BANDWIDTHS: number[] = bandwidthsOf(L2)
