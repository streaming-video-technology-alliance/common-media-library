import type { ThroughputCalculation } from './ThroughputCalculation.js';

/**
 * Returns an object that helps compute an exponentially-weighted moving average
 *
 * @param halfLife - time (in seconds) required for the previous bandwidth
 * estimate (in bps) to decrease by half, when producing the new bandwidth
 * estimate.
 *
 * @returns an object (ThroughputCalculation) that helps compute an
 * exponentially-weighted moving average.
 *
 * @group Throughput
 *
 * @beta
 */
export const ewmaFactory = (halfLife: number): ThroughputCalculation => {
	if (halfLife <= 0) {
		throw new Error('halfLife must be positive');
	}

	let estimateBps = 0;
	let totalDurationSeconds = 0;
	let alpha = Math.exp(Math.log(0.5) / halfLife);

	const configure = (newHalfLife: number): void => {
		if (newHalfLife <= 0) {
			throw new Error('halfLife must be positive');
		}
		alpha = Math.exp(Math.log(0.5) / newHalfLife);
	};

	const addSample = (bps: number, durationSeconds: number): void => {
		const adjAlpha = Math.pow(alpha, durationSeconds);
		const newEstimate = bps * (1 - adjAlpha) + adjAlpha * estimateBps;

		if (!isNaN(newEstimate)) {
			estimateBps = newEstimate;
			totalDurationSeconds += durationSeconds;
		}
	};

	const getEstimate = (): number => {
		// early (underestimated) values are compensated by dividing by a zero
		// factor

		const zeroFactor = 1 - Math.pow(alpha, totalDurationSeconds);
		return estimateBps / zeroFactor;
	};

	const getTotalDuration = (): number => {
		return totalDurationSeconds;
	};

	const instance = {
		addSample,
		getEstimate,
		getTotalDuration,
		configure,
	};

	return instance;
};
